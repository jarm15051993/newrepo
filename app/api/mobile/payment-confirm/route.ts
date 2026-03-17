import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await verifyToken(token)

    const { paymentIntentId } = await request.json()
    if (!paymentIntentId) return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (intent.status !== 'succeeded' && intent.status !== 'processing') {
      return NextResponse.json({ error: `Payment not completed (status: ${intent.status})` }, { status: 400 })
    }

    // Idempotency — don't double-add credits
    const existing = await prisma.payment.findUnique({ where: { stripeSessionId: paymentIntentId } })
    const classCount = parseInt(intent.metadata.classes || '0')
    if (existing) {
      return NextResponse.json({ creditsAdded: classCount })
    }

    const { userId, packageId, classes } = intent.metadata as { userId: string; packageId: string; classes: string }

    await prisma.payment.create({
      data: {
        userId,
        packageId,
        amount: (intent.amount_received || 0) / 100,
        stripeSessionId: paymentIntentId,
        stripePaymentId: paymentIntentId,
        status: 'completed',
      },
    })

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    await prisma.userCredit.create({
      data: {
        userId,
        creditsRemaining: parseInt(classes),
        creditsTotal: parseInt(classes),
        expiresAt,
      },
    })

    // Fire-and-forget purchase confirmation email
    const packageName = intent.metadata.packageName ?? `${classes} Class Pack`
    const amount = ((intent.amount_received || 0) / 100).toFixed(2)
    const expiresLabel = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
      .then(user => {
        if (!user) return
        return sendEmail({
          to: user.email,
          type: 'package_purchase',
          userId,
          vars: { name: user.name ?? 'there', packageName, classCount: classes, amount, expiresAt: expiresLabel },
        })
      })
      .catch(err => console.error('[payment-confirm] Email error:', err))

    return NextResponse.json({ creditsAdded: classCount })
  } catch (error: any) {
    console.error('[mobile/payment-confirm] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

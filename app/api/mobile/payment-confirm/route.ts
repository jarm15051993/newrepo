import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { triggerWalletPassUpdate } from '@/lib/wallet'

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

    const { userId, packageId, classes, durationDays } = intent.metadata as {
      userId: string; packageId: string; classes: string; durationDays?: string
    }

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

    const days = durationDays ? parseInt(durationDays) : 30
    const expiresAt = days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null

    await prisma.userCredit.create({
      data: {
        userId,
        packageId,
        creditsRemaining: parseInt(classes),
        creditsTotal: parseInt(classes),
        expiresAt,
      },
    })

    triggerWalletPassUpdate(userId).catch(err =>
      console.error('[payment-confirm] Wallet sync failed:', err)
    )

    // Fire-and-forget purchase confirmation email
    const packageName = intent.metadata.packageName ?? `${classes} Class Pack`
    const amount = ((intent.amount_received || 0) / 100).toFixed(2)
    const expiresLabel = expiresAt ? expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No expiry'
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

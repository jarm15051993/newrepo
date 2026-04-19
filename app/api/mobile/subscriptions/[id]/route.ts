import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const { id } = await params
    const sub = await prisma.subscription.findUnique({
      where: { id },
    })

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    if (sub.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (sub.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 })
    }
    if (sub.cancelledAt) {
      return NextResponse.json({ error: 'Subscription is already pending cancellation' }, { status: 400 })
    }

    // Cancel at period end — student keeps access until currentPeriodEnd.
    // The customer.subscription.deleted webhook fires at period end → status EXPIRED.
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data:  { cancelledAt: new Date() },
      include: {
        package: {
          select: { name: true, packageType: true, isUnlimited: true, classCount: true, price: true },
        },
        credits: {
          where:   { expiresAt: { gte: new Date() } },
          orderBy: { createdAt: 'desc' },
          take:    1,
        },
      },
    })

    return NextResponse.json({ subscription: updated })
  } catch (error: any) {
    console.error('[mobile/subscriptions/:id] PATCH Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

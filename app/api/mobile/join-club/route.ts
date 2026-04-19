import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const settings = await getSettings(['subscriptionPaymentRequired', 'subscriptionPrice'])

    if (settings.subscriptionPaymentRequired !== 'true') {
      return NextResponse.json({ error: 'Club membership fee is not currently enabled' }, { status: 400 })
    }

    const user = await prisma.user.findUniqueOrThrow({
      where:  { id: userId },
      select: { id: true, email: true, isClubMember: true, role: true },
    })

    // Admins and owners are never affected by the membership gate
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return NextResponse.json({ error: 'Admins and owners do not require club membership' }, { status: 400 })
    }

    if (user.isClubMember) {
      return NextResponse.json({ error: 'Already a club member' }, { status: 409 })
    }

    const amount     = Math.round(parseFloat(settings.subscriptionPrice ?? '10.00') * 100)
    const customerId = await getOrCreateStripeCustomer(userId)

    // One-time PaymentIntent — same pattern as the existing checkout route.
    // Client confirms via the existing payment-sheet flow.
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency:      'eur',
      customer:      customerId,
      receipt_email: user.email,
      metadata:      { userId, type: 'club_membership' },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error: any) {
    console.error('[mobile/join-club] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const { paymentIntentId } = await request.json()
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Verify the payment belongs to this user and is for club membership
    if (pi.metadata?.userId !== userId || pi.metadata?.type !== 'club_membership') {
      return NextResponse.json({ error: 'Invalid payment intent' }, { status: 403 })
    }
    if (pi.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not yet confirmed' }, { status: 400 })
    }

    // Idempotent — safe to call multiple times
    await prisma.user.update({
      where: { id: userId },
      data:  { isClubMember: true },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[mobile/join-club/confirm] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

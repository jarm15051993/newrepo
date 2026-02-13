import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover'
    })

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Check if payment already recorded
    const existingPayment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId }
    })

    if (existingPayment) {
      const classCount = parseInt(session.metadata?.classes || '0')
      return NextResponse.json({
        message: 'Payment already recorded',
        payment: existingPayment,
        creditsAdded: classCount
      })
    }

    // Get metadata from session
    const { userId, packageId, classes } = session.metadata as {
      userId: string
      packageId: string
      classes: string
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId,
        amount: (session.amount_total || 0) / 100, // Convert from cents to euros
        stripeSessionId: sessionId,
        stripePaymentId: session.payment_intent as string,
        status: 'completed'
      }
    })

    // Add credits to user
    const classCount = parseInt(classes)
    const expiryDate = new Date()
    expiryDate.setMonth(expiryDate.getMonth() + 6) // Credits valid for 6 months

    await prisma.userCredit.create({
      data: {
        userId,
        creditsRemaining: classCount,
        creditsTotal: classCount,
        expiresAt: expiryDate
      }
    })

    return NextResponse.json({ 
      message: 'Payment verified and credits added',
      payment,
      creditsAdded: classCount
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
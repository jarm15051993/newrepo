import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

const PACKAGES = [
  { id: '1', name: '1 Class', classes: 1, price: 10 },
  { id: '2', name: '2 Classes', classes: 2, price: 15 },
  { id: '3', name: '5 Classes', classes: 5, price: 35 },
]

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { packageId } = await request.json()
    const selectedPackage = PACKAGES.find(pkg => pkg.id === packageId)
    if (!selectedPackage) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.classes} pilates ${selectedPackage.classes === 1 ? 'class' : 'classes'} at OOMA Wellness Club`,
            },
            unit_amount: selectedPackage.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `ooma://checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `ooma://packages`,
      customer_email: user.email,
      metadata: {
        userId,
        packageId,
        classes: selectedPackage.classes.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('[mobile/checkout] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

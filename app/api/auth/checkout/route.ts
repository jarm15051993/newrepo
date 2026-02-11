import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

const PACKAGES = [
  { id: '1', name: '1 Class', classes: 1, price: 10 },
  { id: '2', name: '2 Classes', classes: 2, price: 15 },
  { id: '3', name: '5 Classes', classes: 5, price: 35 }
]

export async function POST(request: NextRequest) {
  try {
    const { packageId, userId, userEmail } = await request.json()

    // Find the package
    const selectedPackage = PACKAGES.find(pkg => pkg.id === packageId)
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    // Create Stripe checkout session
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
            unit_amount: selectedPackage.price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/packages`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
        packageId: packageId,
        classes: selectedPackage.classes.toString(),
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
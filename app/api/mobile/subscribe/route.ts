import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
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

    const { packageId } = await request.json()
    if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })

    const pkg = await prisma.package.findUnique({
      where:  { id: packageId },
      select: {
        id:               true,
        name:             true,
        classCount:       true,
        price:            true,
        active:           true,
        isStudentPackage: true,
        stripePriceId:    true,
        packageType:      true,
        isUnlimited:      true,
      },
    })

    if (!pkg || !pkg.active) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    if (!pkg.stripePriceId) {
      return NextResponse.json({ error: 'Package is not available for subscription' }, { status: 400 })
    }

    // Enforce student-only packages server-side
    if (pkg.isStudentPackage) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { isStudent: true } })
      if (!user?.isStudent) {
        return NextResponse.json({ error: 'This package is only available to students.' }, { status: 403 })
      }
    }

    // Prevent duplicate active subscription for the same package
    const existing = await prisma.subscription.findFirst({
      where: { userId, packageId, status: { in: ['ACTIVE', 'PAST_DUE'] } },
    })
    if (existing) {
      return NextResponse.json({ error: 'You already have an active subscription for this package' }, { status: 409 })
    }

    const customerId = await getOrCreateStripeCustomer(userId)

    // Create Stripe subscription — stays incomplete until first payment is confirmed.
    const stripeSub = await stripe.subscriptions.create({
      customer:         customerId,
      items:            [{ price: pkg.stripePriceId }],
      payment_behavior: 'default_incomplete',
      expand:           ['latest_invoice'],
      metadata:         { userId, packageId },
    })

    const invoiceRaw = stripeSub.latest_invoice as any
    const invoiceId  = typeof invoiceRaw === 'string' ? invoiceRaw : invoiceRaw?.id

    if (!invoiceId) {
      return NextResponse.json({ error: 'Failed to retrieve invoice' }, { status: 500 })
    }

    // In Stripe SDK v20, payment_intent moved to invoice.payments[0].payment.payment_intent.
    // List the invoice's payments and expand the nested payment_intent to get the client_secret.
    const invoicePayments = await stripe.invoicePayments.list({
      invoice: invoiceId,
      expand: ['data.payment.payment_intent'],
    } as any)

    const firstPayment  = invoicePayments.data[0]
    const paymentIntent = firstPayment?.payment?.payment_intent as Stripe.PaymentIntent | undefined
    const clientSecret  = paymentIntent?.client_secret ?? null

    if (!clientSecret) {
      console.error('[mobile/subscribe] No client_secret found. Payments:', JSON.stringify(invoicePayments.data))
      return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
    }

    const invoice     = invoiceRaw as Stripe.Invoice
    const periodStart = new Date(invoice.period_start * 1000)
    const periodEnd   = new Date(invoice.period_end   * 1000)

    // Create the DB record immediately. The webhook (invoice.payment_succeeded)
    // will create the UserCredit once payment is confirmed. Status starts as
    // ACTIVE optimistically — the webhook reconfirms it on success.
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        packageId,
        stripeSubscriptionId: stripeSub.id,
        status:               'ACTIVE',
        currentPeriodStart:   periodStart,
        currentPeriodEnd:     periodEnd,
      },
    })

    return NextResponse.json({
      subscription,
      clientSecret,
    })
  } catch (error: any) {
    console.error('[mobile/subscribe] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

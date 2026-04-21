import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { endOfDay } from 'date-fns'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

// Stripe requires the raw body for signature verification.
// Next.js App Router exposes it via request.text() — no extra config needed.
export async function POST(request: NextRequest) {
  const body      = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err: any) {
    console.error('[webhook/stripe] Signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        // Ignore unhandled event types
        break
    }
  } catch (err: any) {
    // Return 500 so Stripe retries — do not swallow errors silently
    console.error(`[webhook/stripe] Error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ─── invoice.payment_succeeded ─────────────────────────────────────────────
// Fires for every successful invoice — initial payment and every renewal.
// Expires old credits and provisions a fresh allowance for the new period.
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details
  const stripeSubId = subDetails
    ? typeof subDetails.subscription === 'string'
      ? subDetails.subscription
      : subDetails.subscription?.id
    : null

  if (!stripeSubId) return // one-time invoice, not a subscription

  const sub = await prisma.subscription.findUnique({
    where:   { stripeSubscriptionId: stripeSubId },
    include: { package: true, user: true },
  })

  if (!sub) {
    // Race condition: subscribe route hasn't committed yet. Stripe will retry.
    console.warn('[webhook/stripe] Subscription not found for', stripeSubId, '— will retry')
    throw new Error('Subscription not found — retryable')
  }

  // Use invoice period dates — period_start/end are present on Invoice in all API versions.
  // For default_incomplete subscriptions the first invoice can have period_end == period_start
  // (billing hasn't started yet). Guard against that by falling back to +1 month.
  const periodStart   = new Date(invoice.period_start * 1000)
  const rawPeriodEnd  = new Date(invoice.period_end   * 1000)
  const periodEnd     = rawPeriodEnd <= periodStart
    ? new Date(new Date(periodStart).setMonth(periodStart.getMonth() + 1))
    : rawPeriodEnd

  // Idempotency — if we already created credits for this period, skip
  const alreadyHandled = await prisma.userCredit.findFirst({
    where: {
      subscriptionId: sub.id,
      createdAt:      { gte: periodStart },
    },
  })
  if (alreadyHandled) return

  await prisma.$transaction(async (tx) => {
    // 1. Expire any remaining credits from the previous period
    await tx.userCredit.updateMany({
      where: { subscriptionId: sub.id, creditsRemaining: { gt: 0 } },
      data:  { creditsRemaining: 0 },
    })

    // 2. Update subscription period and ensure status is ACTIVE
    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        status:             'ACTIVE',
        currentPeriodStart: periodStart,
        currentPeriodEnd:   periodEnd,
      },
    })

    // 3. Provision fresh credit allocation for the new period
    await tx.userCredit.create({
      data: {
        userId:           sub.userId,
        packageId:        sub.packageId,
        subscriptionId:   sub.id,
        packageType:      sub.package.packageType,
        isUnlimited:      sub.package.isUnlimited,
        creditsRemaining: sub.package.isUnlimited ? 0 : sub.package.classCount,
        creditsTotal:     sub.package.isUnlimited ? 0 : sub.package.classCount,
        expiresAt:        endOfDay(periodEnd),
        stripePaymentId:  invoice.id,
      },
    })
  })

  // Send confirmation email — fire-and-forget so a failed email doesn't retry the webhook
  sendEmail({
    to:       sub.user.email,
    type:     'package_purchase',
    language: (sub.user.language as any) ?? 'es',
    userId:   sub.user.id,
    vars: {
      name:        sub.user.name ?? '',
      packageName: sub.package.name,
      classCount:  sub.package.isUnlimited ? '∞' : sub.package.classCount.toString(),
      amount:      sub.package.price.toFixed(2),
      renewsAt:    periodEnd.toLocaleDateString('es-ES'),
    },
  }).catch(err => console.error('[webhook/stripe] Failed to send subscription confirmation email:', err))
}

// ─── invoice.payment_failed ────────────────────────────────────────────────
// Fires when a renewal charge fails. Marks the subscription PAST_DUE and
// notifies the student. Stripe smart retries will attempt again automatically.
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subDetails = invoice.parent?.subscription_details
  const stripeSubId = subDetails
    ? typeof subDetails.subscription === 'string'
      ? subDetails.subscription
      : subDetails.subscription?.id
    : null

  if (!stripeSubId) return

  const sub = await prisma.subscription.findUnique({
    where:   { stripeSubscriptionId: stripeSubId },
    include: { user: true, package: true },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data:  { status: 'PAST_DUE' },
  })

  // Notify the student — use a fire-and-forget approach to not block the webhook
  sendEmail({
    to:       sub.user.email,
    type:     'package_purchase', // reuse closest template; add payment_failed template later
    language: (sub.user.language as any) ?? 'es',
    userId:   sub.user.id,
    vars: {
      name:        sub.user.name ?? '',
      packageName: sub.package.name,
      classCount:  sub.package.classCount.toString(),
      amount:      (sub.package.price).toFixed(2),
      expiresAt:   sub.currentPeriodEnd.toLocaleDateString('es-ES'),
    },
  }).catch(err => console.error('[webhook/stripe] Failed to send payment failed email:', err))
}

// ─── customer.subscription.deleted ────────────────────────────────────────
// Fires when a subscription is fully cancelled — either immediately or at
// period end (after cancel_at_period_end was set). Transitions status to
// EXPIRED. Existing UserCredit records are left intact; they expire naturally
// via their expiresAt field.
async function handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: stripeSub.id },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data:  { status: 'EXPIRED' },
  })
}

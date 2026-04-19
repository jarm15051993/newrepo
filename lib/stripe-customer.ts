import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover' as any,
})

/**
 * Returns the Stripe Customer ID for a user, creating one if it doesn't exist.
 * Stores the customer ID on the User record so it is only created once.
 */
export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where:  { id: userId },
    select: { id: true, email: true, name: true, lastName: true, stripeCustomerId: true },
  })

  if (user.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({
    email:    user.email,
    name:     [user.name, user.lastName].filter(Boolean).join(' ') || undefined,
    metadata: { userId },
  })

  await prisma.user.update({
    where: { id: userId },
    data:  { stripeCustomerId: customer.id },
  })

  return customer.id
}

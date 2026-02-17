import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const search = new URL(request.url).searchParams.get('search')?.trim() ?? ''

    const where = search
      ? {
          onboardingCompleted: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { onboardingCompleted: true }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        credits: {
          select: { creditsRemaining: true, creditsTotal: true },
        },
        payments: {
          where: { status: 'completed' },
          select: { amount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    const customers = users.map(u => {
      const availableClasses = u.credits.reduce((sum, c) => sum + c.creditsRemaining, 0)
      const allTimePurchases = u.credits.reduce((sum, c) => sum + c.creditsTotal, 0)
      const totalValue = u.payments.reduce((sum, p) => sum + p.amount, 0)
      const lastPurchase = u.payments.length > 0 ? u.payments[0].createdAt : null

      return {
        id: u.id,
        name: u.name,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        availableClasses,
        allTimePurchases,
        totalValue,
        lastPurchase,
      }
    })

    return NextResponse.json({ customers })
  } catch (error) {
    console.error('Admin customers fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

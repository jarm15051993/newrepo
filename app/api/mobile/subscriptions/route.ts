import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId  = payload.userId

    const subscriptions = await prisma.subscription.findMany({
      where:   { userId },
      include: {
        package: {
          select: {
            name:        true,
            packageType: true,
            isUnlimited: true,
            classCount:  true,
            price:       true,
          },
        },
        // Return the most recent credit for this period (to show classes remaining)
        credits: {
          where:   { expiresAt: { gte: new Date() } },
          orderBy: { createdAt: 'desc' },
          take:    1,
        },
      },
      orderBy: [
        // ACTIVE before CANCELLED/PAST_DUE/EXPIRED
        { status: 'asc' },
        { currentPeriodEnd: 'asc' },
      ],
    })

    return NextResponse.json({ subscriptions })
  } catch (error: any) {
    console.error('[mobile/subscriptions] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

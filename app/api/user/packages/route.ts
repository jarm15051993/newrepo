import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const userCredits = await prisma.userCredit.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: 'asc' },
    })

    const now = new Date()

    const active = userCredits
      .filter(uc => uc.creditsRemaining > 0 && (uc.expiresAt === null || uc.expiresAt > now))
      .map(uc => ({
        id: uc.id,
        name: uc.package?.name ?? 'Class Pack',
        classesTotal: uc.creditsTotal,
        classesRemaining: uc.creditsRemaining,
        purchasedAt: uc.createdAt,
        expiresAt: uc.expiresAt,
      }))
      // oldest first (already ordered by createdAt asc)

    const expired = userCredits
      .filter(uc => uc.creditsRemaining === 0 || (uc.expiresAt !== null && uc.expiresAt <= now))
      .map(uc => ({
        id: uc.id,
        name: uc.package?.name ?? 'Class Pack',
        classesTotal: uc.creditsTotal,
        classesRemaining: uc.creditsRemaining,
        purchasedAt: uc.createdAt,
        expiresAt: uc.expiresAt,
        expiredReason: uc.creditsRemaining === 0 ? 'classes_used' : 'date_expired',
      }))
      .sort((a, b) => {
        // most recently expired first
        const aExp = a.expiresAt?.getTime() ?? 0
        const bExp = b.expiresAt?.getTime() ?? 0
        return bExp - aExp
      })

    return NextResponse.json({ active, expired })
  } catch (error: any) {
    console.error('[user/packages] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

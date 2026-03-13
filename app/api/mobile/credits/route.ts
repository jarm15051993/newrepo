import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const credits = await prisma.userCredit.findMany({
      where: {
        userId,
        creditsRemaining: {
          gt: 0
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    })

    const totalCredits = credits.reduce((sum, credit) => sum + credit.creditsRemaining, 0)

    return NextResponse.json({ totalCredits, credits })
  } catch (error: any) {
    console.error('[mobile/credits] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

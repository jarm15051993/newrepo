import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    // Support tenant mode: admin viewing a student's credits
    const tenantUserId = request.headers.get('x-tenant-user-id')
    const effectiveUserId = tenantUserId ?? payload.userId

    // Return all non-expired credits (including depleted ones) so the frontend
    // can distinguish "wrong plan type" from "right type but out of credits"
    const credits = await prisma.userCredit.findMany({
      where: {
        userId: effectiveUserId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    })

    const totalCredits = credits.reduce((sum, c) => sum + Math.max(0, c.creditsRemaining), 0)

    return NextResponse.json({ totalCredits, credits })
  } catch (error: any) {
    console.error('[mobile/credits] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

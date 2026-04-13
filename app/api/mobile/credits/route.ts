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

    // Return only active credits (remaining > 0 or unlimited, non-expired).
    // Include the linked package so we can use Package.packageType as the source
    // of truth — UserCredit.packageType defaults to BOTH on legacy records.
    const credits = await prisma.userCredit.findMany({
      where: {
        userId: effectiveUserId,
        OR: [
          { isUnlimited: true },
          { creditsRemaining: { gt: 0 } }
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: new Date() } }
            ]
          }
        ]
      },
      include: { package: { select: { packageType: true } } }
    })

    const totalCredits = credits.reduce((sum, c) => sum + c.creditsRemaining, 0)

    return NextResponse.json({
      totalCredits,
      credits: credits.map(c => ({
        id: c.id,
        creditsRemaining: c.creditsRemaining,
        // Prefer the Package's packageType; fall back to the credit's own field
        // for manually-granted credits that have no linked package
        packageType: c.package?.packageType ?? c.packageType,
        isUnlimited: c.isUnlimited,
      }))
    })
  } catch (error: any) {
    console.error('[mobile/credits] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

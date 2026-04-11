import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { triggerWalletPassUpdate } from '@/lib/wallet'

const WELCOME_GIFT_PACKAGE_NAME = 'Early Member Free Class'

export async function POST(request: NextRequest) {
  try {
    if (process.env.EARLY_MEMBER_GIFT_ENABLED !== 'true') {
      return NextResponse.json({ error: 'This promotion is not currently active.' }, { status: 403 })
    }

    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    // Find the dedicated gift package
    const giftPackage = await prisma.package.findFirst({
      where: { name: WELCOME_GIFT_PACKAGE_NAME },
    })
    if (!giftPackage) {
      return NextResponse.json({ error: 'Gift package not found.' }, { status: 500 })
    }

    // Check if already claimed
    const existing = await prisma.userCredit.findFirst({
      where: { userId, packageId: giftPackage.id },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already claimed.' }, { status: 409 })
    }

    // Create the credit — expiresAt null = no expiry
    const userCredit = await prisma.userCredit.create({
      data: {
        userId,
        packageId: giftPackage.id,
        creditsTotal: 1,
        creditsRemaining: 1,
        expiresAt: null,
        stripePaymentId: null,
      },
    })

    triggerWalletPassUpdate(userId).catch(err =>
      console.error('[claim-welcome-gift] Wallet sync failed:', err)
    )

    return NextResponse.json({ success: true, userCredit }, { status: 200 })
  } catch (error) {
    console.error('[claim-welcome-gift] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

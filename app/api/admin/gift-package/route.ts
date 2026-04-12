import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { sendEmail, type EmailLanguage } from '@/lib/email'
import { triggerWalletPassUpdate } from '@/lib/wallet'

/**
 * POST /api/admin/gift-package
 *
 * Grants a package's credits to a user without a Stripe payment.
 * Requires an active tenant session (X-Tenant-User-Id header).
 * Caller must be OWNER or have isAdmin flag.
 *
 * Body: { userId: string, packageId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const tenantUserId = request.headers.get('x-tenant-user-id')
    if (!tenantUserId) {
      return NextResponse.json({ error: 'This action requires an active tenant session.' }, { status: 400 })
    }

    const isOwner = payload.role === 'OWNER'
    if (!isOwner && !payload.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, packageId } = body as { userId?: string; packageId?: string }

    if (!userId || !packageId) {
      return NextResponse.json({ error: 'userId and packageId are required' }, { status: 400 })
    }

    const [targetUser, pkg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, language: true },
      }),
      prisma.package.findUnique({
        where: { id: packageId },
        select: { id: true, name: true, classCount: true, durationDays: true, packageType: true, isUnlimited: true },
      }),
    ])

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

    const expiresAt =
      pkg.durationDays && pkg.durationDays > 0
        ? new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000)
        : null

    const userCredit = await prisma.$transaction(async tx => {
      const credit = await tx.userCredit.create({
        data: {
          userId,
          packageId,
          creditsTotal: pkg.classCount,
          creditsRemaining: pkg.classCount,
          expiresAt,
          stripePaymentId: null,
          packageType: pkg.packageType,
          isUnlimited: pkg.isUnlimited,
        },
      })

      await tx.adminAuditLog.create({
        data: {
          adminId: payload.userId,
          targetUserId: userId,
          action: 'GIFT_PACKAGE',
          metadata: { packageId, packageName: pkg.name, classCount: pkg.classCount, creditId: credit.id },
        },
      })

      return credit
    })

    triggerWalletPassUpdate(userId).catch(err =>
      console.error('[gift-package] Wallet sync failed:', err)
    )

    // Fire-and-forget confirmation email to the recipient
    const lang = (targetUser.language ?? 'es') as EmailLanguage
    const locale = lang === 'en' ? 'en-GB' : lang === 'ca' ? 'ca-ES' : 'es-ES'
    const expiresLabel = expiresAt
      ? expiresAt.toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
      : 'No expiry'

    sendEmail({
      to: targetUser.email,
      type: 'package_purchase',
      language: lang,
      userId,
      vars: {
        name: targetUser.name ?? 'there',
        packageName: pkg.name,
        classCount: String(pkg.classCount),
        amount: '0.00',
        expiresAt: expiresLabel,
      },
    }).catch(err => console.error('[gift-package] Email error:', err))

    return NextResponse.json({ success: true, userCredit })
  } catch (error: any) {
    console.error('[gift-package] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

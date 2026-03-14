import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { SignJWT, importPKCS8 } from 'jose'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)

    if (!process.env.GOOGLE_WALLET_CREDENTIALS || !process.env.GOOGLE_WALLET_ISSUER_ID) {
      return NextResponse.json({ error: 'Google Wallet not configured' }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, lastName: true, qrCode: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.qrCode) return NextResponse.json({ error: 'QR code not yet generated' }, { status: 400 })

    const credits = await prisma.userCredit.findMany({
      where: {
        userId: user.id,
        creditsRemaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    const totalCredits = credits.reduce((sum, c) => sum + c.creditsRemaining, 0)
    const fullName = [user.name, user.lastName].filter(Boolean).join(' ') || 'Ooma Member'

    const credentials = JSON.parse(process.env.GOOGLE_WALLET_CREDENTIALS)
    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
    const classId = `${issuerId}.ooma_class_pass`
    // Object IDs must be alphanumeric + underscores/dots
    const objectId = `${issuerId}.user_${user.id.replace(/[^a-zA-Z0-9_.-]/g, '_')}`

    const loyaltyObject = {
      id: objectId,
      classId,
      state: 'ACTIVE',
      accountName: fullName,
      accountId: user.id,
      loyaltyPoints: {
        balance: { string: String(totalCredits) },
        label: 'Classes Left',
      },
      textModulesData: [
        {
          header: 'MEMBERSHIP',
          body: 'Class Pass',
          id: 'membership',
        },
      ],
      barcode: {
        type: 'QR_CODE',
        value: user.qrCode,
        alternateText: '',
      },
    }

    const privateKey = await importPKCS8(credentials.private_key, 'RS256')

    // Build the Google Wallet "Save to Wallet" JWT
    // Note: `typ` here is a Google-specific payload claim, not the standard JWT header typ
    const walletJwt = await new SignJWT({
      origins: [] as string[],
      typ: 'savetowallet',
      payload: {
        loyaltyClasses: [
          {
            id: classId,
            issuerName: 'Ooma Wellness',
            programName: 'Ooma Class Pass',
            reviewStatus: 'UNDER_REVIEW',
          },
        ],
        loyaltyObjects: [loyaltyObject],
      },
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(credentials.client_email)
      .setAudience('google')
      .sign(privateKey)

    return NextResponse.json({ saveUrl: `https://pay.google.com/gp/v/save/${walletJwt}` })
  } catch (error) {
    console.error('Google Wallet error:', error)
    return NextResponse.json({ error: 'Failed to generate pass' }, { status: 500 })
  }
}

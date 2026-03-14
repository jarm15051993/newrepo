import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { PKPass } from 'passkit-generator'

// C.burg = #6B1D2E → rgb(107, 29, 46)
// C.cream = #F7F3EE → rgb(247, 243, 238)
const PASS_BG_COLOR = 'rgb(107, 29, 46)'
const PASS_FG_COLOR = 'rgb(247, 243, 238)'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)

    const missingEnv = ['APPLE_PASS_CERT', 'APPLE_PASS_KEY', 'APPLE_WWDR_CERT', 'APPLE_PASS_TYPE_ID', 'APPLE_TEAM_ID']
      .filter(k => !process.env[k])
    if (missingEnv.length > 0) {
      return NextResponse.json(
        { error: 'Apple Wallet not configured', missing: missingEnv },
        { status: 503 }
      )
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

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      serialNumber: user.id,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
      organizationName: 'Ooma Wellness',
      description: 'Ooma Class Pass',
      logoText: 'Ooma',
      backgroundColor: PASS_BG_COLOR,
      labelColor: PASS_FG_COLOR,
      foregroundColor: PASS_FG_COLOR,
      generic: {
        headerFields: [
          { key: 'name', label: 'MEMBER', value: fullName },
        ],
        primaryFields: [
          { key: 'type', label: 'MEMBERSHIP', value: 'Class Pass' },
        ],
        secondaryFields: [
          { key: 'credits', label: 'CLASSES LEFT', value: String(totalCredits) },
        ],
      },
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: user.qrCode,
          messageEncoding: 'iso-8859-1',
        },
      ],
    }

    const pass = new PKPass(
      { 'pass.json': Buffer.from(JSON.stringify(passJson)) },
      {
        wwdr: Buffer.from(process.env.APPLE_WWDR_CERT!, 'base64'),
        signerCert: Buffer.from(process.env.APPLE_PASS_CERT!, 'base64'),
        signerKey: Buffer.from(process.env.APPLE_PASS_KEY!, 'base64'),
      }
    )

    const buffer = pass.getAsBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="ooma-class-pass.pkpass"',
      },
    })
  } catch (error) {
    console.error('Apple Wallet error:', error)
    return NextResponse.json({ error: 'Failed to generate pass' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { PKPass } from 'passkit-generator'

const PASS_BG_COLOR = 'rgb(107, 29, 46)'
const PASS_FG_COLOR = 'rgb(247, 243, 238)'

const walletSecret = new TextEncoder().encode(
  process.env.JWT_SECRET! + '_wallet'
)

// POST /api/wallet/apple — returns a short-lived URL the mobile app opens in Safari
export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const walletToken = await new SignJWT({ userId: payload.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(walletSecret)

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/wallet/apple?token=${walletToken}`
    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('[wallet/apple POST]', error?.message)
    return NextResponse.json({ error: 'Failed to generate wallet URL' }, { status: 500 })
  }
}

// GET /api/wallet/apple?token=xxx — returns the .pkpass file (opened by Safari)
export async function GET(request: NextRequest) {
  try {
    const walletToken = request.nextUrl.searchParams.get('token')
    if (!walletToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { payload } = await jwtVerify(walletToken, walletSecret)
    const userId = payload.userId as string

    const missingEnv = ['APPLE_PASS_CERT', 'APPLE_PASS_KEY', 'APPLE_WWDR_CERT', 'APPLE_PASS_TYPE_ID', 'APPLE_TEAM_ID']
      .filter(k => !process.env[k])
    if (missingEnv.length > 0) {
      return NextResponse.json({ error: 'Apple Wallet not configured', missing: missingEnv }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        headerFields: [{ key: 'name', label: 'MEMBER', value: fullName }],
        primaryFields: [{ key: 'type', label: 'MEMBERSHIP', value: 'Class Pass' }],
        secondaryFields: [{ key: 'credits', label: 'CLASSES LEFT', value: String(totalCredits) }],
      },
      barcodes: [{ format: 'PKBarcodeFormatQR', message: user.qrCode, messageEncoding: 'iso-8859-1' }],
    }

    const ICON_1X = 'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAIAAADZ8fBYAAAAVElEQVR4nGP4/vkdLRDDqLnD0dxsWT1ciHxz8RhK0Gic5hI0FL/R2M0l0lA8RmMxlyRDcRk9au6oucPMXFrlN5KMxqWd7uUZQaPxaxxm9dCouRQiAAWJRPD43zHYAAAAAElFTkSuQmCC'
    const ICON_2X = 'iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAIAAABu2d1/AAAAqklEQVR4nO3ZsRWAMAhFURdxBRdzdxsLWzcwQIAY8s55Pbf+bM99TdQ2XAD3N8GFCxduFPfcD0njuUKoF9rONUD70UZup9UsVnNdoGa0jutu1YoV3CCrSlyUG2qVi0XcBKtQXI6bZpWIa3GTrU0xXLhw4cKFCxeuAzdf/I0px80UNyUVuTliCaPozjAfN04sB5ReIH3RhrtrrOc96J5zi31+koMLFy5cuLm9+LEAnKKfYMQAAAAASUVORK5CYII='
    const ICON_3X = 'iVBORw0KGgoAAAANSUhEUgAAAFcAAABXCAIAAAD+qk47AAABJUlEQVR4nO3bsRECQQwEwU+EFEiM3HEwcEnhpdu91VFTpQA0bUvX9/NmrvgGEwYFFFBAAQUUUEABBRRQGKvwejzvz78plOIjHEaFxfidHBYFeb/bQq9gJTBBKBU29JssZAqbCbQQGoUIgRBCoBAkUEGsKsQJJBBLCvF4FURfIZ4thGgqxIO1ECh0FeKpcoiyQjzSAYFCXSGeZ4JAAYWGQjzMB4ECClWFeJIVAgUUUEABBRRQQAEFFFBAAQUU3AonQtxPQwGFhsJZEKUuFFDoKZwCUY1CoaUwH6JRxC0LCosKMyHaLdw7LivMgVis4A5apJCFkOzPf4RUYT+EcHP+pjwKbgjHwvxTmhVUHBs25M96u8LYQQEFFFBAAQUUUEABBRRQqM4PG0wfxEghuvQAAAAASUVORK5CYII='

    const pass = new PKPass(
      {
        'pass.json': Buffer.from(JSON.stringify(passJson)),
        'icon.png': Buffer.from(ICON_1X, 'base64'),
        'icon@2x.png': Buffer.from(ICON_2X, 'base64'),
        'icon@3x.png': Buffer.from(ICON_3X, 'base64'),
      },
      {
        wwdr: Buffer.from(process.env.APPLE_WWDR_CERT!, 'base64'),
        signerCert: Buffer.from(process.env.APPLE_PASS_CERT!, 'base64'),
        signerKey: Buffer.from(process.env.APPLE_PASS_KEY!, 'base64'),
      }
    )

    const buffer = await pass.getAsBuffer()

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="ooma-class-pass.pkpass"',
      },
    })
  } catch (error: any) {
    console.error('[wallet/apple GET]', error?.message)
    return NextResponse.json({ error: error?.message ?? 'Failed to generate pass' }, { status: 500 })
  }
}

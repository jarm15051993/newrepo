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
      },
      barcodes: [{ format: 'PKBarcodeFormatQR', message: user.qrCode, messageEncoding: 'iso-8859-1' }],
    }

    const ICON_1X = 'iVBORw0KGgoAAAANSUhEUgAAAB0AAAAdCAIAAADZ8fBYAAAAVElEQVR4nGP4/vkdLRDDqLnD0dxsWT1ciHxz8RhK0Gic5hI0FL/R2M0l0lA8RmMxlyRDcRk9au6oucPMXFrlN5KMxqWd7uUZQaPxaxxm9dCouRQiAAWJRPD43zHYAAAAAElFTkSuQmCC'
    const ICON_2X = 'iVBORw0KGgoAAAANSUhEUgAAADoAAAA6CAIAAABu2d1/AAAAqklEQVR4nO3ZsRWAMAhFURdxBRdzdxsLWzcwQIAY8s55Pbf+bM99TdQ2XAD3N8GFCxduFPfcD0njuUKoF9rONUD70UZup9UsVnNdoGa0jutu1YoV3CCrSlyUG2qVi0XcBKtQXI6bZpWIa3GTrU0xXLhw4cKFCxeuAzdf/I0px80UNyUVuTliCaPozjAfN04sB5ReIH3RhrtrrOc96J5zi31+koMLFy5cuLm9+LEAnKKfYMQAAAAASUVORK5CYII='
    const ICON_3X = 'iVBORw0KGgoAAAANSUhEUgAAAFcAAABXCAIAAAD+qk47AAABJUlEQVR4nO3bsRECQQwEwU+EFEiM3HEwcEnhpdu91VFTpQA0bUvX9/NmrvgGEwYFFFBAAQUUUEABBRRQGKvwejzvz78plOIjHEaFxfidHBYFeb/bQq9gJTBBKBU29JssZAqbCbQQGoUIgRBCoBAkUEGsKsQJJBBLCvF4FURfIZ4thGgqxIO1ECh0FeKpcoiyQjzSAYFCXSGeZ4JAAYWGQjzMB4ECClWFeJIVAgUUUEABBRRQQAEFFFBAAQUU3AonQtxPQwGFhsJZEKUuFFDoKZwCUY1CoaUwH6JRxC0LCosKMyHaLdw7LivMgVis4A5apJCFkOzPf4RUYT+EcHP+pjwKbgjHwvxTmhVUHBs25M96u8LYQQEFFFBAAQUUUEABBRRQqM4PG0wfxEghuvQAAAAASUVORK5CYII='
    const LOGO_1X = 'iVBORw0KGgoAAAANSUhEUgAAAKAAAAAyCAYAAADbYdBlAAAACXBIWXMAAAsTAAALEwEAmpwYAAAD0klEQVR4nO3aW4xdUxgA4BmltJ0oKmk7SFBTdUlIxDVUJpJSzahLa1xiCNXSIaUlIdKquLXi8uBFU6SN8CqReBBC4vZARAjxIPHgRXhAQvri8sk6/U+zc+w9aeKMOcb/JSd777XW3ufskz/r8u/d15dSSimllFJKKaWUUkoppZRSSimllFJKKaX0H4UZWIgj96PtAI7BzH/n16VpCwdhA27FeViGR3F1Tduz8BSuxDm4BU9gXqXNEvxQ6mvOPxTfYWlN3SA+xspJutXUi/A4NmJRR/nzJSgrx2fjXRzc0e5UfITZlbJv8VzNd63EHzisoQd+DW929QZT78IleAA7a+qOwo84PI4/xUjDdV7A5srw/DB+xqyOdquid1xSc41lOBa/4MSu3mjqTTH0fo4VDfVv4yacgl9xQEO7Ejxfxf4QTsY31WEcJ+D0+L7hmmusiu0OPNPVG029CbfZa3FD/U5sx1X4YoLrLIqhtQyjSzE3esHXK21GY/sGrus4vxWcfXv3T8NPmNPVm029B+vwZ92QGPUvxhzxinYP19BuMX4vPWR7ERFB9VusrPtxeZTvwqaO81d3HH+INV270dSbcAc+wWUN9e+V3iqCaQ8ObGi3Ap/F/r5VLN7HvbgQC6JsG56stJmFSzuud0OZc3bzXlMPwvmxCNlVUzcUC4aBSjC2htGatq/g7poALKmdLzvmgnfh5crxSOkBaz7f16Vy0jSD+2MxMlQpK3O5V9sLgygrC5EPSi6v4/ySO3ynnZRuD7WVvN+ejqAcLe2bht82PIaX9hWk6SnmZzdGUrn0RtfHwmO4Ya5X5oRjMezeXtIv7RwgTsJuzK+cs72dO4yk99ayoMGZGC/B3/C7NuBrLJ/cfyD1jNKLNaVaatoeMvm/KKWUpkpZ9cZ8sL9S1j9R2/Z+tbyz3UTXSf9DZY6GtbgoVq4Xx3PbB2O7vtJ2PLb34YJSh+NKaiUWGKtjjlgSyltifjkjHtFtie8pc8Vr4zrrKznJsUjBPDKFf0eaCrgTN0cAro2XD7ZGDq8uAEvgbcJDEYBPx7PlM2IBUbZrYqExM4K79YwXR1QCcLzyVGYsfseO/Z2Lpmmi5Ooi+Fo9XgRgCYbhCKLl8arVs7E/HqvatyIAN0fPeW7UlyC+Bvfg6PJSQ/SAo9EDbougXBcr740RgCPxGO9vb8ykaSx6qdkRVHNiW97Rmx/Hg5HXW9jej/MGYogdjLryOG5BpHfKeXMr31GuOS/qWteO8nb7ARxf2k3lf5FSSimllFJKKaWUUkoppZRSSimllFJKKaXU9w/8BSB716PswyMTAAAAAElFTkSuQmCC'
    const LOGO_2X = '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'
    const LOGO_3X = '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'

    const pass = new PKPass(
      {
        'pass.json': Buffer.from(JSON.stringify(passJson)),
        'icon.png': Buffer.from(ICON_1X, 'base64'),
        'icon@2x.png': Buffer.from(ICON_2X, 'base64'),
        'icon@3x.png': Buffer.from(ICON_3X, 'base64'),
        'logo.png': Buffer.from(LOGO_1X, 'base64'),
        'logo@2x.png': Buffer.from(LOGO_2X, 'base64'),
        'logo@3x.png': Buffer.from(LOGO_3X, 'base64'),
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

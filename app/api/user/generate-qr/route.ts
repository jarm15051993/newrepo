import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, qrCode: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Idempotent — return existing QR code if already generated
    if (user.qrCode) return NextResponse.json({ qrCode: user.qrCode })

    const qrCode = uuidv4()
    await prisma.user.update({ where: { id: user.id }, data: { qrCode } })

    return NextResponse.json({ qrCode })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

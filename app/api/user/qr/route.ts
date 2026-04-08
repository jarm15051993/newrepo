import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { qrCode: true } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let qrCode = user.qrCode
    if (!qrCode) {
      qrCode = crypto.randomUUID()
      await prisma.user.update({ where: { id: userId }, data: { qrCode } })
    }

    return NextResponse.json({ qrCode })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

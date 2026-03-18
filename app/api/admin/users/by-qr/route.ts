import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const code = request.nextUrl.searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { qrCode: code },
      select: { id: true, name: true, lastName: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      userId: user.id,
      fullName: [user.name, user.lastName].filter(Boolean).join(' '),
    })
  } catch (error) {
    console.error('Admin by-qr error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

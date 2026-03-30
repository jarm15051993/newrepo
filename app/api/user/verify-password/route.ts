import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const { password } = await request.json()
    if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { password: true },
    })

    if (!user?.password) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 })
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni, userId } = body as { dni?: string; userId?: string }

    if (!dni || typeof dni !== 'string') {
      return NextResponse.json({ error: 'dni is required' }, { status: 400 })
    }

    const normalized = dni.trim().toUpperCase()

    const existing = await prisma.user.findFirst({
      where: {
        dni: normalized,
        ...(userId ? { NOT: { id: userId } } : {}),
      },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json({ available: false }, { status: 409 })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error('[validate-dni] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

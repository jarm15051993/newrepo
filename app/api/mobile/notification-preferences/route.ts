import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

const CONTROLLABLE_TYPES = ['booking_confirmation', 'booking_cancellation', 'package_purchase'] as const
type PreferenceType = typeof CONTROLLABLE_TYPES[number]

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)

    const rows = await prisma.notificationPreference.findMany({
      where: { userId: payload.userId },
    })

    // Build response — default to enabled:true for any type not yet in DB
    const preferences = CONTROLLABLE_TYPES.map(type => {
      const row = rows.find(r => r.type === type)
      return { type, enabled: row ? row.enabled : true }
    })

    return NextResponse.json({ preferences })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    const { type, enabled } = await request.json()

    if (!CONTROLLABLE_TYPES.includes(type as PreferenceType) || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid preference type or value' }, { status: 400 })
    }

    await prisma.notificationPreference.upsert({
      where: { userId_type: { userId: payload.userId, type } },
      update: { enabled },
      create: { userId: payload.userId, type, enabled },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

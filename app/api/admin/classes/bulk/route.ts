import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

type BulkClassInput = {
  title: string
  instructor: string
  date: string       // YYYY-MM-DD
  startTime: string  // HH:MM
  durationMins: number
  capacity: number
}

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const isOwner = payload.role === 'OWNER'
    if (!isOwner && !payload.canBulkUpload) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { classes } = await request.json()
    if (!Array.isArray(classes) || classes.length === 0) {
      return NextResponse.json({ error: 'No classes provided' }, { status: 400 })
    }

    const toCreate = []
    const failed: number[] = []

    for (let i = 0; i < classes.length; i++) {
      const c: BulkClassInput = classes[i]
      if (c.capacity > 6) { failed.push(i); continue }

      const [hours, mins] = c.startTime.split(':').map(Number)
      const start = new Date(`${c.date}T00:00:00`)
      start.setHours(hours, mins, 0, 0)
      const end = new Date(start.getTime() + c.durationMins * 60_000)

      toCreate.push({
        title: c.title,
        instructor: c.instructor || null,
        startTime: start,
        endTime: end,
        capacity: c.capacity,
        bookedCount: 0,
      })
    }

    const result = await prisma.class.createMany({ data: toCreate })

    return NextResponse.json({
      created: result.count,
      failed: failed.length,
    })
  } catch (err) {
    console.error('[bulk classes] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

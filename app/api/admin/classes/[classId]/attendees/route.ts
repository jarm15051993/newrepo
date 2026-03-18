import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { classId } = await params

    const cls = await prisma.class.findUnique({ where: { id: classId } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    const bookings = await prisma.booking.findMany({
      where: {
        classId,
        status: { in: ['confirmed', 'attended'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            goals: true,
            additionalInfo: true,
          },
        },
      },
      orderBy: { stretcherNumber: 'asc' },
    })

    const attendees = bookings.map((b) => ({
      bookingId: b.id,
      status: b.status,
      stretcherNumber: b.stretcherNumber,
      user: {
        id: b.user.id,
        fullName: [b.user.name, b.user.lastName].filter(Boolean).join(' '),
        goals: b.user.goals ?? null,
        healthConditions: b.user.additionalInfo ?? null,
      },
    }))

    return NextResponse.json({
      class: {
        id: cls.id,
        title: cls.title,
        startTime: cls.startTime,
        endTime: cls.endTime,
        instructor: cls.instructor,
      },
      attendees,
    })
  } catch (error) {
    console.error('Admin attendees fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

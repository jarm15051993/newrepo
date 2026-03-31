import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    const userId = request.headers.get('x-tenant-user-id') ?? payload.userId

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        status: 'attended',
      },
      include: {
        class: {
          select: {
            title: true,
            startTime: true,
            endTime: true,
            instructor: true,
          },
        },
      },
      orderBy: { class: { startTime: 'desc' } },
    })

    const history = bookings.map((b) => {
      const durationMins = Math.round(
        (b.class.endTime.getTime() - b.class.startTime.getTime()) / 60000
      )
      return {
        bookingId: b.id,
        class: {
          title: b.class.title,
          startsAt: b.class.startTime,
          instructor: b.class.instructor,
          durationMins,
        },
        stretcherNumber: b.stretcherNumber,
        attendedAt: b.attendedAt,
      }
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Bookings history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

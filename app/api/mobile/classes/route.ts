import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    // Get classes from now onwards
    const classes = await prisma.class.findMany({
      where: {
        startTime: {
          gte: new Date()
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Fetch user's confirmed bookings for these classes in one query
    const userBookingMap: Record<string, { stretcherNumber: number | null; bookingId: string }> = {}
    if (classes.length > 0) {
      const userBookings = await prisma.booking.findMany({
        where: {
          userId,
          classId: { in: classes.map(c => c.id) },
          status: 'confirmed'
        },
        select: { id: true, classId: true, stretcherNumber: true }
      })
      for (const b of userBookings) {
        userBookingMap[b.classId] = { stretcherNumber: b.stretcherNumber, bookingId: b.id }
      }
    }

    const classesWithSpots = classes.map(cls => {
      const userBooking = userBookingMap[cls.id] ?? null
      const bookedCount = cls.bookedCount ?? 0
      return {
        id: cls.id,
        title: cls.title,
        startTime: cls.startTime,
        endTime: cls.endTime,
        capacity: cls.capacity,
        instructor: cls.instructor,
        bookedSpots: bookedCount,
        availableSpots: cls.capacity - bookedCount,
        isFull: bookedCount >= cls.capacity,
        isBooked: userBooking !== null,
        userStretcherNumber: userBooking?.stretcherNumber ?? null,
        bookingId: userBooking?.bookingId ?? null,
      }
    })

    return NextResponse.json({ classes: classesWithSpots })
  } catch (error: any) {
    console.error('[mobile/classes] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

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

    // If userId provided, fetch their bookings for these classes in one query
    const userBookingMap: Record<string, number> = {}
    if (userId && classes.length > 0) {
      const userBookings = await prisma.booking.findMany({
        where: {
          userId,
          classId: { in: classes.map(c => c.id) },
          status: 'confirmed'
        },
        select: { classId: true, stretcherNumber: true }
      })
      for (const b of userBookings) {
        userBookingMap[b.classId] = b.stretcherNumber
      }
    }

    // Use stored bookedCount for capacity info
    const classesWithSpots = classes.map(cls => {
      const reformerNumber = userBookingMap[cls.id] ?? null
      const bookedCount = cls.bookedCount ?? 0
      return {
        ...cls,
        bookedSpots: bookedCount,
        availableSpots: cls.capacity - bookedCount,
        isFull: bookedCount >= cls.capacity,
        isBooked: reformerNumber !== null,
        userStretcherNumber: reformerNumber
      }
    })

    return NextResponse.json({ classes: classesWithSpots })
  } catch (error: any) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
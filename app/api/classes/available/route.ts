import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get classes from now onwards
    const classes = await prisma.class.findMany({
      where: {
        startTime: {
          gte: new Date()
        }
      },
      include: {
        bookings: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // Add available spots info
    const classesWithSpots = classes.map(cls => ({
      ...cls,
      bookedSpots: cls.bookings.filter(b => b.status === 'confirmed').length,
      availableSpots: 6 - cls.bookings.filter(b => b.status === 'confirmed').length,
      isFull: cls.bookings.filter(b => b.status === 'confirmed').length >= 6
    }))

    return NextResponse.json({ classes: classesWithSpots })
  } catch (error: any) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
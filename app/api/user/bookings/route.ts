import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        status: 'confirmed',
        class: {
          startTime: {
            gte: new Date()
          }
        }
      },
      include: {
        class: true
      },
      orderBy: {
        class: {
          startTime: 'asc'
        }
      }
    })

    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
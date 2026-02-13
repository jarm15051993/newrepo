import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      where: {
        startTime: {
          gte: new Date()
        }
      },
      include: {
        bookings: {
          where: { status: 'confirmed' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { stretcherNumber: 'asc' }
        }
      },
      orderBy: { startTime: 'asc' }
    })

    return NextResponse.json({ classes })
  } catch (error: any) {
    console.error('Admin classes fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, startTime, endTime, capacity, instructor } = await request.json()

    if (!title || !startTime || !endTime || !capacity) {
      return NextResponse.json(
        { error: 'Title, start time, end time, and capacity are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const newClass = await prisma.class.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        capacity: parseInt(capacity),
        instructor: instructor || null
      }
    })

    return NextResponse.json({ message: 'Class created successfully', class: newClass })
  } catch (error: any) {
    console.error('Admin class create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

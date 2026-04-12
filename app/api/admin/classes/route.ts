import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await verifyToken(token) // any authenticated user can fetch classes

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
                phone: true,
                additionalInfo: true,
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
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.canCreateClass && payload.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, startTime, endTime, capacity, instructor, classType } = await request.json()

    if (!title || !startTime || !endTime || !capacity) {
      return NextResponse.json(
        { error: 'Title, start time, end time, and capacity are required' },
        { status: 400 }
      )
    }

    if (classType && !['REFORMER', 'YOGA'].includes(classType)) {
      return NextResponse.json({ error: 'Invalid classType. Must be REFORMER or YOGA' }, { status: 400 })
    }

    if (capacity < 1 || capacity > 6) {
      return NextResponse.json({ error: 'Capacity must be between 1 and 6' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const durationMins = (end.getTime() - start.getTime()) / 60000
    if (durationMins < 30 || durationMins > 180 || durationMins % 10 !== 0) {
      return NextResponse.json(
        { error: 'Duration must be between 30 and 180 minutes in 10-minute increments.' },
        { status: 400 }
      )
    }

    const newClass = await prisma.class.create({
      data: {
        title,
        description: description || null,
        startTime: start,
        endTime: end,
        capacity: parseInt(capacity),
        instructor: instructor || null,
        classType: classType ?? 'REFORMER',
      }
    })

    return NextResponse.json({ message: 'Class created successfully', class: newClass })
  } catch (error: any) {
    console.error('Admin class create error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

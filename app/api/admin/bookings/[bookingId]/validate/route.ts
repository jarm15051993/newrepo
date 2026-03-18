import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { bookingId } = await params
    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { class: true },
    })

    if (!booking || booking.classId !== classId) {
      return NextResponse.json(
        { error: 'Booking not found for this class.' },
        { status: 400 }
      )
    }

    if (booking.status === 'attended') {
      return NextResponse.json({ booking, alreadyValidated: true }, { status: 200 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Booking is not in a confirmable state.' },
        { status: 400 }
      )
    }

    const now = new Date()
    const windowOpen = new Date(booking.class.startTime.getTime() - 60 * 60 * 1000)
    const windowClose = booking.class.endTime

    if (now < windowOpen || now > windowClose) {
      return NextResponse.json(
        { error: 'Validation is only available from 1 hour before the class until it ends.' },
        { status: 400 }
      )
    }

    const updated = await prisma.$transaction(async (tx) => {
      return tx.booking.update({
        where: { id: bookingId },
        data: { status: 'attended', attendedAt: new Date() },
        include: { class: true, user: { select: { id: true, name: true, lastName: true } } },
      })
    })

    return NextResponse.json({ booking: updated, alreadyValidated: false }, { status: 200 })
  } catch (error) {
    console.error('Admin validate booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

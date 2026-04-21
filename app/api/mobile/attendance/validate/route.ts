import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { startOfDay, endOfDay } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload.canValidateAttendance) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { qrCode } = body

    if (!qrCode || typeof qrCode !== 'string') {
      return NextResponse.json({ error: 'qrCode is required' }, { status: 400 })
    }

    const member = await prisma.user.findUnique({
      where: { qrCode },
      select: { id: true, name: true, lastName: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'QR_NOT_FOUND' }, { status: 404 })
    }

    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const booking = await prisma.booking.findFirst({
      where: {
        userId: member.id,
        status: 'confirmed',
        class: {
          startTime: { gte: todayStart, lte: todayEnd },
        },
      },
      include: {
        class: { select: { title: true, classType: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'NO_BOOKING_TODAY' }, { status: 404 })
    }

    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'attended', attendedAt: new Date() },
    })

    return NextResponse.json({
      memberName: `${member.name ?? ''} ${member.lastName ?? ''}`.trim(),
      className: booking.class.title,
      classType: booking.class.classType,
      stretcherNumber: booking.stretcherNumber ?? null,
    })
  } catch (error) {
    console.error('[attendance/validate]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

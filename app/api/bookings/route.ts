import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const { classId } = await request.json()
    if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 })

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: { where: { status: 'confirmed' }, select: { stretcherNumber: true } },
      },
    })

    if (!cls || cls.startTime <= new Date()) {
      return NextResponse.json({ error: 'Class not found or has already started' }, { status: 400 })
    }

    const spotsLeft = cls.capacity - cls.bookedCount
    if (spotsLeft <= 0) {
      return NextResponse.json({ error: 'This class is fully booked.' }, { status: 400 })
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { userId_classId: { userId, classId } },
    })
    if (existingBooking && existingBooking.status === 'confirmed') {
      return NextResponse.json({ error: 'You are already booked for this class.' }, { status: 400 })
    }

    // Find oldest active UserCredit
    const now = new Date()
    const activeCredits = await prisma.userCredit.findMany({
      where: {
        userId,
        creditsRemaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      orderBy: { createdAt: 'asc' },
    })

    if (activeCredits.length === 0) {
      return NextResponse.json(
        { error: 'No active classes remaining. Please purchase a package.' },
        { status: 400 }
      )
    }

    const creditToUse = activeCredits[0]

    // Find available reformer number
    const bookedNumbers = cls.bookings.map(b => b.stretcherNumber)
    const availableReformer = [1, 2, 3, 4, 5, 6].find(n => !bookedNumbers.includes(n))
    if (!availableReformer) {
      return NextResponse.json({ error: 'No reformers available' }, { status: 400 })
    }

    const booking = await prisma.$transaction(async tx => {
      const newBooking = await tx.booking.upsert({
        where: { userId_classId: { userId, classId } },
        create: {
          userId,
          classId,
          stretcherNumber: availableReformer,
          status: 'confirmed',
          userCreditId: creditToUse.id,
          creditLost: false,
          cancelledAt: null,
        },
        update: {
          stretcherNumber: availableReformer,
          status: 'confirmed',
          userCreditId: creditToUse.id,
          creditLost: false,
          cancelledAt: null,
        },
        include: { class: true },
      })

      await tx.userCredit.update({
        where: { id: creditToUse.id },
        data: { creditsRemaining: creditToUse.creditsRemaining - 1 },
      })

      await tx.class.update({
        where: { id: classId },
        data: { bookedCount: { increment: 1 } },
      })

      return newBooking
    })

    // Fire-and-forget confirmation email
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
      .then(user => {
        if (!user) return
        const date = booking.class.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        const time = booking.class.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        return sendEmail({
          to: user.email,
          type: 'booking_confirmation',
          userId,
          vars: {
            name: user.name ?? 'there',
            classTitle: booking.class.title,
            date,
            time,
            reformerNumber: String(booking.stretcherNumber),
          },
        })
      })
      .catch(err => console.error('[bookings POST] Email error:', err))

    return NextResponse.json({ booking })
  } catch (error: any) {
    console.error('[bookings POST] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

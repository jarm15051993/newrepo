import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/app-url'

function toIcalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildIcs({ uid, title, description, location, start, end }: {
  uid: string
  title: string
  description: string
  location: string
  start: Date
  end: Date
}): string {
  const now = toIcalDate(new Date())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OOMA Wellness Club//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toIcalDate(start)}`,
    `DTEND:${toIcalDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function POST(request: NextRequest) {
  try {
    const { userId, classId } = await request.json()

    if (!userId || !classId) {
      return NextResponse.json(
        { error: 'User ID and Class ID required' },
        { status: 400 }
      )
    }

    // Check if user has credits
    const credits = await prisma.userCredit.findMany({
      where: {
        userId,
        creditsRemaining: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      orderBy: {
        expiresAt: 'asc' // Use oldest credits first
      }
    })

    if (credits.length === 0 || credits.reduce((sum, c) => sum + c.creditsRemaining, 0) === 0) {
      return NextResponse.json(
        { error: 'No credits available' },
        { status: 400 }
      )
    }

    // Check if already booked
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_classId: {
          userId,
          classId
        }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You have already booked this class' },
        { status: 400 }
      )
    }

    // Fetch class to check capacity via bookedCount
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { bookedCount: true, capacity: true, bookings: { select: { stretcherNumber: true }, where: { status: 'confirmed' } } }
    })

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (cls.bookedCount >= cls.capacity) {
      return NextResponse.json(
        { error: 'Class is full' },
        { status: 400 }
      )
    }

    // Find available reformer number
    const bookedNumbers = cls.bookings.map(b => b.stretcherNumber)
    const availableReformer = [1, 2, 3, 4, 5, 6].find(num => !bookedNumbers.includes(num))

    if (!availableReformer) {
      return NextResponse.json(
        { error: 'No reformers available' },
        { status: 400 }
      )
    }

    // Create booking, deduct credit, and increment bookedCount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          classId,
          stretcherNumber: availableReformer,
          status: 'confirmed'
        },
        include: {
          class: true
        }
      })

      // Deduct one credit from the oldest credit record
      const creditToUse = credits[0]
      await tx.userCredit.update({
        where: { id: creditToUse.id },
        data: {
          creditsRemaining: creditToUse.creditsRemaining - 1
        }
      })

      // Increment bookedCount on the class
      await tx.class.update({
        where: { id: classId },
        data: { bookedCount: { increment: 1 } }
      })

      return booking
    })

    // Send booking confirmation email with .ics calendar invite (fire-and-forget)
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
      .then(user => {
        if (!user) return
        const cls = result.class
        const date = new Date(cls.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        const time = `${new Date(cls.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(cls.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
        const icsContent = buildIcs({
          uid: `booking-${result.id}@oomawellness.com`,
          title: cls.title,
          description: `Reformer #${result.stretcherNumber} — OOMA Wellness Club`,
          location: 'OOMA Wellness Club',
          start: cls.startTime,
          end: cls.endTime,
        })
        return sendEmail({
          to: user.email,
          type: 'booking_confirmation',
          userId,
          vars: { name: user.name ?? user.email, classTitle: cls.title, date, time, reformerNumber: String(result.stretcherNumber), dashboardUrl: `${getAppUrl()}/dashboard` },
          metadata: { bookingId: result.id, classId },
          attachments: [{ filename: 'class-invite.ics', content: Buffer.from(icsContent), contentType: 'text/calendar; method=REQUEST' }],
        })
      })
      .catch(e => console.error('[book] Failed to send confirmation email:', e))

    return NextResponse.json({
      message: 'Class booked successfully',
      booking: result
    })
  } catch (error: any) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, classId } = await request.json()

    if (!userId || !classId) {
      return NextResponse.json(
        { error: 'User ID and Class ID required' },
        { status: 400 }
      )
    }

    // Find the booking and include class + user details for the cancellation email
    const booking = await prisma.booking.findUnique({
      where: {
        userId_classId: { userId, classId }
      },
      include: {
        class: { select: { title: true, startTime: true, endTime: true } },
        user: { select: { email: true, name: true } },
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Cancel booking, reinstate credit, and decrement bookedCount in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the booking
      await tx.booking.delete({
        where: { id: booking.id }
      })

      // Decrement bookedCount on the class
      await tx.class.update({
        where: { id: classId },
        data: { bookedCount: { decrement: 1 } }
      })

      // Find the oldest non-expired credit record to return the credit to
      const creditRecord = await tx.userCredit.findFirst({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        orderBy: { expiresAt: 'asc' }
      })

      if (creditRecord) {
        await tx.userCredit.update({
          where: { id: creditRecord.id },
          data: { creditsRemaining: creditRecord.creditsRemaining + 1 }
        })
      } else {
        // All credit records are expired — create a new one with 6-month expiry
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + 6)
        await tx.userCredit.create({
          data: {
            userId,
            creditsRemaining: 1,
            creditsTotal: 1,
            expiresAt
          }
        })
      }
    })

    // Send cancellation email (fire-and-forget)
    const cancelledClass = booking.class
    const cancelledUser = booking.user
    const date = new Date(cancelledClass.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    const time = `${new Date(cancelledClass.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(cancelledClass.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    sendEmail({
      to: cancelledUser.email,
      type: 'booking_cancellation',
      userId,
      vars: { name: cancelledUser.name ?? cancelledUser.email, classTitle: cancelledClass.title, date, time, bookUrl: `${getAppUrl()}/book` },
      metadata: { classId },
    }).catch(e => console.error('[book] Failed to send cancellation email:', e))

    return NextResponse.json({ message: 'Booking cancelled and credit reinstated' })
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
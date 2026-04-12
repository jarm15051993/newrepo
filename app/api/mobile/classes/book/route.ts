import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { sendEmail, type EmailLanguage } from '@/lib/email'
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
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    // Fetch class to determine classType before credit validation
    const clsForType = await prisma.class.findUnique({
      where: { id: classId },
      select: { classType: true }
    })

    if (!clsForType) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check if user has credits compatible with this class type
    const credits = await prisma.userCredit.findMany({
      where: {
        userId,
        creditsRemaining: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ],
        packageType: { in: [clsForType.classType, 'BOTH'] }
      },
      orderBy: {
        expiresAt: 'asc' // Use oldest credits first
      }
    })

    // Also check unlimited credits (creditsRemaining is irrelevant for unlimited)
    const unlimitedCredits = await prisma.userCredit.findMany({
      where: {
        userId,
        isUnlimited: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ],
        packageType: { in: [clsForType.classType, 'BOTH'] }
      }
    })

    const hasUnlimited = unlimitedCredits.length > 0
    const creditToUse = hasUnlimited ? unlimitedCredits[0] : credits[0]

    if (!hasUnlimited && credits.length === 0) {
      return NextResponse.json(
        { error: 'No credits available for this class type. Please purchase a compatible package.' },
        { status: 400 }
      )
    }

    // Check if already booked
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_classId: { userId, classId }
      }
    })

    if (existingBooking) {
      return NextResponse.json({ error: 'You have already booked this class' }, { status: 400 })
    }

    // Fetch class to check capacity
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        bookedCount: true,
        capacity: true,
        bookings: { select: { stretcherNumber: true }, where: { status: 'confirmed' } }
      }
    })

    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    if (cls.bookedCount >= cls.capacity) {
      return NextResponse.json({ error: 'Class is full' }, { status: 400 })
    }

    // Find available reformer number
    const bookedNumbers = cls.bookings.map(b => b.stretcherNumber)
    const availableReformer = [1, 2, 3, 4, 5, 6].find(num => !bookedNumbers.includes(num))

    if (!availableReformer) {
      return NextResponse.json({ error: 'No reformers available' }, { status: 400 })
    }

    // Create booking, optionally deduct credit, and increment bookedCount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          userId,
          classId,
          stretcherNumber: availableReformer,
          status: 'confirmed',
          userCreditId: creditToUse.id,
        },
        include: {
          class: true
        }
      })

      // Only deduct if not an unlimited credit
      if (!hasUnlimited) {
        await tx.userCredit.update({
          where: { id: creditToUse.id },
          data: { creditsRemaining: creditToUse.creditsRemaining - 1 }
        })
      }

      // Increment bookedCount on the class
      await tx.class.update({
        where: { id: classId },
        data: { bookedCount: { increment: 1 } }
      })

      return booking
    })

    // Send booking confirmation email with .ics calendar invite
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, language: true } })
      if (user) {
        const bookedClass = result.class
        const lang = (user.language ?? 'es') as EmailLanguage
        const locale = lang === 'en' ? 'en-GB' : lang === 'ca' ? 'ca-ES' : 'es-ES'
        const date = new Date(bookedClass.startTime).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        const time = `${new Date(bookedClass.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${new Date(bookedClass.endTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
        const icsContent = buildIcs({
          uid: `booking-${result.id}@oomawellness.com`,
          title: bookedClass.title,
          description: `Reformer #${result.stretcherNumber} — OOMA Wellness Club`,
          location: 'OOMA Wellness Club',
          start: bookedClass.startTime,
          end: bookedClass.endTime,
        })
        await sendEmail({
          to: user.email,
          type: 'booking_confirmation',
          language: lang,
          userId,
          vars: {
            name: user.name ?? user.email,
            classTitle: bookedClass.title,
            date,
            time,
            reformerNumber: String(result.stretcherNumber),
            dashboardUrl: `${getAppUrl()}/dashboard`
          },
          metadata: { bookingId: result.id, classId },
          attachments: [{
            filename: 'class-invite.ics',
            content: Buffer.from(icsContent),
            contentType: 'text/calendar; method=REQUEST'
          }],
        })
      }
    } catch (e) {
      console.error('[mobile/classes/book] Failed to send confirmation email:', e)
    }

    return NextResponse.json({
      message: 'Class booked successfully',
      booking: result
    })
  } catch (error: any) {
    console.error('[mobile/classes/book] Booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    // Find the booking and include class + user details for the cancellation email
    const booking = await prisma.booking.findUnique({
      where: {
        userId_classId: { userId, classId }
      },
      include: {
        class: { select: { title: true, startTime: true, endTime: true } },
        user: { select: { email: true, name: true, language: true } },
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Determine if the credit used was unlimited (skip reinstatement if so)
    const usedCredit = booking.userCreditId
      ? await prisma.userCredit.findUnique({
          where: { id: booking.userCreditId },
          select: { isUnlimited: true }
        })
      : null

    // Cancel booking, reinstate credit if applicable, and decrement bookedCount in a transaction
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

      // Reinstate credit only if not unlimited and the credit record still exists
      if (!usedCredit?.isUnlimited && booking.userCreditId) {
        await tx.userCredit.update({
          where: { id: booking.userCreditId },
          data: { creditsRemaining: { increment: 1 } }
        })
      }
    })

    // Send cancellation email
    try {
      const cancelledClass = booking.class
      const cancelledUser = booking.user
      const lang = (cancelledUser.language ?? 'es') as EmailLanguage
      const locale = lang === 'en' ? 'en-GB' : lang === 'ca' ? 'ca-ES' : 'es-ES'
      const date = new Date(cancelledClass.startTime).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      const time = `${new Date(cancelledClass.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${new Date(cancelledClass.endTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
      await sendEmail({
        to: cancelledUser.email,
        type: 'booking_cancellation',
        language: lang,
        userId,
        vars: {
          name: cancelledUser.name ?? cancelledUser.email,
          classTitle: cancelledClass.title,
          date,
          time,
          bookUrl: `${getAppUrl()}/book`
        },
        metadata: { classId },
      })
    } catch (e) {
      console.error('[mobile/classes/book] Failed to send cancellation email:', e)
    }

    return NextResponse.json({ message: 'Booking cancelled and credit reinstated' })
  } catch (error: any) {
    console.error('[mobile/classes/book] Cancel error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

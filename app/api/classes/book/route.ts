import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

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

    // Send booking confirmation email (fire-and-forget)
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
      .then(user => {
        if (!user) return
        const cls = result.class
        const date = new Date(cls.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        const time = `${new Date(cls.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(cls.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
        return sendEmail({
          to: user.email,
          type: 'booking_confirmation',
          userId,
          vars: { name: user.name, classTitle: cls.title, date, time, reformerNumber: String(result.stretcherNumber) },
          metadata: { bookingId: result.id, classId },
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

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: {
        userId_classId: { userId, classId }
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

    return NextResponse.json({ message: 'Booking cancelled and credit reinstated' })
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
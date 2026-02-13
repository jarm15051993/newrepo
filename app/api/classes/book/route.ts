import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Check class capacity
    const bookingsCount = await prisma.booking.count({
      where: {
        classId,
        status: 'confirmed'
      }
    })

    if (bookingsCount >= 6) {
      return NextResponse.json(
        { error: 'Class is full' },
        { status: 400 }
      )
    }

    // Find available stretcher number
    const bookedStretchers = await prisma.booking.findMany({
      where: {
        classId,
        status: 'confirmed'
      },
      select: {
        stretcherNumber: true
      }
    })

    const bookedNumbers = bookedStretchers.map(b => b.stretcherNumber)
    const availableStretcher = [1, 2, 3, 4, 5, 6].find(num => !bookedNumbers.includes(num))

    if (!availableStretcher) {
      return NextResponse.json(
        { error: 'No stretchers available' },
        { status: 400 }
      )
    }

    // Create booking and deduct credit in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create booking
      const booking = await tx.booking.create({
        data: {
          userId,
          classId,
          stretcherNumber: availableStretcher,
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

      return booking
    })

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
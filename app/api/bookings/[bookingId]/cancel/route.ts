import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { sendEmail } from '@/lib/email'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { class: true },
    })

    if (!booking || booking.userId !== userId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 })
    }

    const now = new Date()
    const hoursUntilClass = (booking.class.startTime.getTime() - now.getTime()) / 3600000
    const isLateCancellation = hoursUntilClass < 1
    const creditLost = isLateCancellation

    const updatedBooking = await prisma.$transaction(async tx => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          creditLost,
          cancelledAt: now,
        },
        include: { class: true },
      })

      await tx.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      })

      // Return credit only on eligible cancellation and if linked to a UserCredit
      if (!creditLost && booking.userCreditId) {
        await tx.userCredit.update({
          where: { id: booking.userCreditId },
          data: { creditsRemaining: { increment: 1 } },
        })
      }

      return updated
    })

    // Fire-and-forget cancellation email
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } })
      .then(user => {
        if (!user) return
        const date = updatedBooking.class.startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        const time = updatedBooking.class.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        const creditNote = creditLost
          ? 'This class was cancelled less than 1 hour before it started, so your credit was not returned.'
          : 'Your credit has been returned to your account.'
        return sendEmail({
          to: user.email,
          type: 'booking_cancellation',
          userId,
          vars: { name: user.name ?? 'there', classTitle: updatedBooking.class.title, date, time, creditNote },
        })
      })
      .catch(err => console.error('[bookings/cancel] Email error:', err))

    return NextResponse.json({ booking: updatedBooking, creditLost })
  } catch (error: any) {
    console.error('[bookings/cancel] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

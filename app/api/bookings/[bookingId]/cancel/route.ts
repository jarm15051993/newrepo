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

    const tenantUserId = request.headers.get('x-tenant-user-id')
    if (tenantUserId && !payload.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminId = tenantUserId ? payload.userId : null
    const effectiveUserId = tenantUserId ?? payload.userId

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { class: true },
    })

    if (!booking || booking.userId !== effectiveUserId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'confirmed') {
      return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 })
    }

    const now = new Date()
    const hoursUntilClass = (booking.class.startTime.getTime() - now.getTime()) / 3600000
    const creditLost = hoursUntilClass < 1

    const updatedBooking = await prisma.$transaction(async tx => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'cancelled', stretcherNumber: null, creditLost, cancelledAt: now },
        include: { class: true, user: true },
      })

      await tx.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      })

      if (!creditLost && booking.userCreditId) {
        await tx.userCredit.update({
          where: { id: booking.userCreditId },
          data: { creditsRemaining: { increment: 1 } },
        })
      }

      if (adminId) {
        await tx.adminAuditLog.create({
          data: {
            adminId,
            targetUserId: effectiveUserId,
            action: 'CANCEL_BOOKING',
            metadata: { bookingId, classId: booking.classId, creditLost },
          },
        })
      }

      return updated
    })

    // Cancellation email → always to the target user
    prisma.user.findUnique({ where: { id: effectiveUserId }, select: { email: true, name: true } })
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
          userId: effectiveUserId,
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

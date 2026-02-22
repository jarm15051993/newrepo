import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    })

    // Always return 200 — don't reveal whether the email exists
    if (!user) {
      return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
    }

    // Delete any existing unused tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    // Create a new reset token (expires in 1 hour)
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const appUrl = getAppUrl()
    const link = `${appUrl}/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      type: 'password_reset',
      userId: user.id,
      vars: { name: user.name ?? user.email, link },
      metadata: { resetToken: token },
    })

    return NextResponse.json({ message: 'If that email is registered, a reset link has been sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

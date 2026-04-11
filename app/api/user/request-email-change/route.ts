import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { sendEmail, type EmailLanguage } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const { newEmail } = await request.json()
    if (!newEmail?.trim()) {
      return NextResponse.json({ error: 'New email is required.' }, { status: 400 })
    }

    const trimmed = newEmail.trim().toLowerCase()
    if (!EMAIL_RE.test(trimmed)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: trimmed, mode: 'insensitive' }, NOT: { id: payload.userId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, language: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const emailChangeToken = crypto.randomUUID()
    const emailChangeTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: payload.userId },
      data: { pendingEmail: trimmed, emailChangeToken, emailChangeTokenExpiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ''
    const link = `${appUrl}/api/auth/verify-email-change?token=${emailChangeToken}`

    await sendEmail({
      to: trimmed,
      type: 'email_verification',
      language: (user.language ?? 'es') as EmailLanguage,
      userId: payload.userId,
      vars: { name: user.name ?? 'there', newEmail: trimmed, link },
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[request-email-change]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

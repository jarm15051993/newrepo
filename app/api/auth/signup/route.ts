import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'email', message: 'Email is required.' }, { status: 400 })
    }

    // Case-insensitive duplicate check
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'email', message: 'An account with this email already exists. Try logging in or reset your password.' },
        { status: 400 }
      )
    }

    const activationToken = crypto.randomUUID()

    const user = await prisma.user.create({
      data: { email, activationToken },
    })

    // Send activation email (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    sendEmail({
      to: user.email,
      type: 'activation',
      userId: user.id,
      vars: { name: user.email, link: `${appUrl}/activate?token=${activationToken}` },
    }).catch(e => console.error('[signup] Failed to send activation email:', e))

    return NextResponse.json({ message: 'Check your email to activate your account.' }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'server', message: 'Internal server error' }, { status: 500 })
  }
}

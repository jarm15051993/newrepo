import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/app-url'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body.email?.trim().toLowerCase()
    const platform = body.platform === 'mobile' ? 'mobile' : 'web'

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
        { status: 409 }
      )
    }

    const activationToken = crypto.randomUUID()

    const user = await prisma.user.create({
      data: { email, activationToken },
    })

    const appUrl = getAppUrl()
    const activationLink = platform === 'mobile'
      ? `${appUrl}/activate?token=${activationToken}&email=${encodeURIComponent(email)}&platform=mobile`
      : `${appUrl}/activate?token=${activationToken}`

    try {
      await sendEmail({
        to: user.email,
        type: 'activation',
        userId: user.id,
        vars: { name: user.email, link: activationLink },
      })
    } catch (emailErr) {
      console.error('[signup] Failed to send activation email:', emailErr)
    }

    return NextResponse.json({ message: 'Check your email to activate your account.' }, { status: 201 })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'server', message: 'Internal server error' }, { status: 500 })
  }
}

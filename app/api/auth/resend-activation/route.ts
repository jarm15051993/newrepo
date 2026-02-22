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
    if (!user || user.activatedAt) {
      return NextResponse.json({ message: 'If that account exists and is not yet activated, a new link has been sent.' })
    }

    // Generate a fresh activation token
    const activationToken = crypto.randomUUID()
    await prisma.user.update({
      where: { id: user.id },
      data: { activationToken },
    })

    const appUrl = getAppUrl()
    await sendEmail({
      to: user.email,
      type: 'activation',
      userId: user.id,
      vars: { name: user.name ?? user.email, link: `${appUrl}/activate?token=${activationToken}` },
    })

    return NextResponse.json({ message: 'If that account exists and is not yet activated, a new link has been sent.' })
  } catch (error) {
    console.error('Resend activation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

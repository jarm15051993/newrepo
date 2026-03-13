import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { getAppUrl } from '@/lib/app-url'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, lastName, email: rawEmail, password } = await request.json()
    const email = rawEmail?.trim().toLowerCase()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const activationToken = crypto.randomUUID()

    const user = await prisma.user.create({
      data: { name, lastName, email, password: hashedPassword, activationToken },
    })

    const appUrl = getAppUrl()
    try {
      await sendEmail({
        to: user.email,
        type: 'activation',
        userId: user.id,
        vars: { name: user.name ?? user.email, link: `${appUrl}/activate?token=${activationToken}` },
      })
    } catch (emailErr) {
      console.error('[mobile/register] Failed to send activation email:', emailErr)
    }

    return NextResponse.json(
      { message: 'Account created. Please check your email to activate your account.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Mobile register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

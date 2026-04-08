import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Find user — case-insensitive so "User@Email.com" matches "user@email.com"
    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Block login if account has not been activated
    if (!user.activatedAt) {
      return NextResponse.json(
        { error: 'not_activated', message: 'Please activate your account first. Check your email for the activation link.' },
        { status: 403 }
      )
    }

    // Block login if onboarding is not complete
    if (!user.onboardingCompleted) {
      return NextResponse.json(
        { error: 'onboarding_incomplete', userId: user.id },
        { status: 403 }
      )
    }

    // Check password (password is guaranteed non-null after onboarding)
    const passwordMatch = await bcrypt.compare(password, user.password!)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Backfill qrCode for users who registered before this field existed
    let qrCode = user.qrCode
    if (!qrCode) {
      qrCode = crypto.randomUUID()
      await prisma.user.update({ where: { id: user.id }, data: { qrCode } })
    }

    // Return only safe, non-sensitive fields — never expose health data, isAdmin, tokens
    return NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
          phone: user.phone,
          profilePicture: user.profilePicture,
          onboardingCompleted: user.onboardingCompleted,
          createdAt: user.createdAt,
          qrCode,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, password, name, lastName, phone, goals, birthday, additionalInfo } = body

    if (!userId || !password || !name || !lastName || !phone || !goals || !birthday) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    if (!user.activatedAt) {
      return NextResponse.json({ message: 'Account not activated' }, { status: 403 })
    }

    // Check phone uniqueness (ignore self)
    const existingPhone = await prisma.user.findFirst({
      where: { phone, NOT: { id: userId } },
    })
    if (existingPhone) {
      return NextResponse.json({ message: 'That phone number is already registered.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        name,
        lastName,
        phone,
        goals,
        birthday: new Date(birthday),
        additionalInfo: additionalInfo || null,
        onboardingCompleted: true,
      },
    })

    const { password: _, ...userWithoutPassword } = updated

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

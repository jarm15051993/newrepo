import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { validateDNI } from '@/utils/validateDNI'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, password, name, lastName, phone, goals, goalIds, birthday, additionalInfo, dni, language } = body

    const usingGoalIds = Array.isArray(goalIds) && goalIds.length > 0
    if (!userId || !password || !name || !lastName || !phone || !birthday || (!usingGoalIds && !goals)) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    if (!dni || typeof dni !== 'string' || !dni.trim()) {
      return NextResponse.json({ message: 'DNI/NIE is required.' }, { status: 400 })
    }

    const normalizedDni = dni.trim().toUpperCase()

    if (!validateDNI(normalizedDni)) {
      return NextResponse.json({ message: 'Invalid DNI/NIE format.' }, { status: 400 })
    }

    const existingDni = await prisma.user.findFirst({
      where: { dni: normalizedDni, NOT: { id: userId } },
      select: { id: true },
    })
    if (existingDni) {
      return NextResponse.json({ message: 'This DNI/NIE is already registered.' }, { status: 409 })
    }

    if (usingGoalIds) {
      if (goalIds.length < 1 || goalIds.length > 3) {
        return NextResponse.json({ message: 'Please select between 1 and 3 goals.' }, { status: 400 })
      }
      const validGoals = await prisma.goal.findMany({
        where: { id: { in: goalIds }, isActive: true },
      })
      if (validGoals.length !== goalIds.length) {
        return NextResponse.json({ message: 'One or more selected goals are invalid.' }, { status: 400 })
      }
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return NextResponse.json({ message: 'Password must contain at least one letter and one number.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check phone uniqueness (ignore self)
    const existingPhone = await prisma.user.findFirst({
      where: { phone, NOT: { id: userId } },
    })
    if (existingPhone) {
      return NextResponse.json({ message: 'That phone number is already registered.' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          name,
          lastName,
          phone,
          dni: normalizedDni,
          ...(!usingGoalIds && { goals }),
          birthday: new Date(birthday),
          additionalInfo: additionalInfo || null,
          onboardingCompleted: true,
          language: ['en', 'es', 'ca'].includes(language) ? language : 'es',
          activatedAt: user.activatedAt ?? new Date(),
          qrCode: user.qrCode ?? crypto.randomUUID(),
        },
      })
      if (usingGoalIds) {
        await tx.userGoal.createMany({
          data: goalIds.map((goalId: string) => ({ userId, goalId })),
          skipDuplicates: true,
        })
      }
      return u
    })

    const { password: _, ...userWithoutPassword } = updated

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error('Complete onboarding error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, lastName, email, phone, birthday, goals, goalIds, additionalInfo, language } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Check if email is taken by another user
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email: { equals: email.trim(), mode: 'insensitive' }, NOT: { id: userId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
    }

    // Check if phone is taken by another user
    if (phone) {
      const existing = await prisma.user.findFirst({
        where: { phone: phone.trim(), NOT: { id: userId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Phone number already in use' }, { status: 409 })
      }
    }

    const usingGoalIds = Array.isArray(goalIds)
    if (usingGoalIds) {
      if (goalIds.length < 1 || goalIds.length > 3) {
        return NextResponse.json({ error: 'Please select between 1 and 3 goals.' }, { status: 400 })
      }
      const validGoals = await prisma.goal.findMany({
        where: { id: { in: goalIds }, isActive: true },
      })
      if (validGoals.length !== goalIds.length) {
        return NextResponse.json({ error: 'One or more selected goals are invalid.' }, { status: 400 })
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(lastName !== undefined && { lastName: lastName.trim() }),
          ...(email !== undefined && { email: email.trim().toLowerCase() }),
          ...(phone !== undefined && { phone: phone.trim() }),
          ...(birthday !== undefined && { birthday: new Date(birthday) }),
          ...(!usingGoalIds && goals !== undefined && { goals: goals.trim() || null }),
          ...(additionalInfo !== undefined && { additionalInfo: additionalInfo.trim() || null }),
          ...(language !== undefined && ['en', 'es', 'ca'].includes(language) && { language }),
        },
        select: {
          id: true, email: true, name: true, lastName: true,
          phone: true, birthday: true, goals: true, additionalInfo: true, profilePicture: true,
        },
      })
      if (usingGoalIds) {
        await tx.userGoal.deleteMany({ where: { userId } })
        await tx.userGoal.createMany({
          data: goalIds.map((goalId: string) => ({ userId, goalId })),
        })
      }
      return u
    })

    return NextResponse.json({ user: updated }, { status: 200 })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

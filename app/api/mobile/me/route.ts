import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        phone: true,
        profilePicture: true,
        onboardingCompleted: true,
        qrCode: true,
        activatedAt: true,
        createdAt: true,
        updatedAt: true,
        isBeta: true,
        role: true,
        language: true,
        goals: true,
        userGoals: {
          select: { goalId: true, goal: { select: { label: true } } },
          orderBy: { goal: { sortOrder: 'asc' } },
        },
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { role, userGoals, goals, language, ...userFields } = user
    const isBeta = role === 'ADMIN' || role === 'OWNER' ? false : user.isBeta
    // Admins and owners always see English; students use their stored language preference
    const resolvedLanguage = (role === 'ADMIN' || role === 'OWNER') ? 'en' : (language ?? 'es')
    const userGoalIds = userGoals.map(ug => ug.goalId)
    const goalsDisplay = userGoals.length > 0
      ? userGoals.map(ug => ug.goal.label).join(', ')
      : goals

    return NextResponse.json({ user: { ...userFields, isBeta, language: resolvedLanguage, goals: goalsDisplay, userGoalIds } }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

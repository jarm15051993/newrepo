import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const search = new URL(request.url).searchParams.get('search')?.trim() ?? ''

    const where = search
      ? {
          onboardingCompleted: false,
          OR: [
            { name:     { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email:    { contains: search, mode: 'insensitive' as const } },
            { phone:    { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : { onboardingCompleted: false }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        name:      true,
        lastName:  true,
        email:     true,
        phone:     true,
        createdAt: true,
      },
    })

    return NextResponse.json({ customers: users })
  } catch (error) {
    console.error('Admin inactive-customers fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

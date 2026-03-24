import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const payload = await verifyToken(token)
    if (!payload.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
    if (q.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters.' }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { equals: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        phone: true,
        onboardingCompleted: true,
      },
      take: 10,
    })

    const results = users.map(u => ({
      id: u.id,
      fullName: [u.name, u.lastName].filter(Boolean).join(' ') || u.email,
      email: u.email,
      phone: u.phone ?? '',
      onboardingCompleted: u.onboardingCompleted,
    }))

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('[admin/users/search] Error:', error)
    return NextResponse.json({ error: 'Search failed.' }, { status: 500 })
  }
}

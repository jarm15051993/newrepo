import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    // Read isStudent from DB on every call — ensures immediate effect without requiring logout
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isStudent: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const packages = await prisma.package.findMany({
      where: { active: true },
      orderBy: [{ isStudentPackage: 'asc' }, { price: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        classCount: true,
        price: true,
        durationDays: true,
        isStudentPackage: true,
      },
    })

    const result = packages.map(pkg => ({
      ...pkg,
      isPurchasable: pkg.isStudentPackage ? user.isStudent : !user.isStudent,
    }))

    return NextResponse.json({ packages: result })
  } catch (error: any) {
    console.error('[mobile/packages] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

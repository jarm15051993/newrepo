import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const goals = await prisma.goal.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, label: true },
    })
    return NextResponse.json(goals)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

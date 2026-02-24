import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { customers } = await request.json()
    if (!Array.isArray(customers)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    let created = 0
    let skipped = 0

    for (const c of customers) {
      const email = c.email?.trim().toLowerCase()
      if (!email) { skipped++; continue }

      const existing = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      })
      if (existing) { skipped++; continue }

      await prisma.user.create({
        data: {
          email,
          name:      c.name?.trim()      || null,
          lastName:  c.lastName?.trim()  || null,
          phone:     c.phone?.trim()     || null,
          onboardingCompleted: true,
          activatedAt: new Date(),
        },
      })
      created++
    }

    return NextResponse.json({ created, skipped })
  } catch (error: any) {
    console.error('[customers/import]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

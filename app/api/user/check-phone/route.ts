import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get('phone')
  const excludeUserId = searchParams.get('excludeUserId')

  if (!phone) {
    return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: {
      phone,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
  })

  return NextResponse.json({ available: !existing })
}

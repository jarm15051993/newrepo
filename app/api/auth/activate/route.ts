import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { activationToken: token } })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or already used activation link' }, { status: 400 })
  }

  if (user.activatedAt) {
    // Already activated — direct to onboarding if not completed, else login
    if (!user.onboardingCompleted) {
      return NextResponse.json({ message: 'Account already activated', userId: user.id }, { status: 200 })
    }
    return NextResponse.json({ message: 'Account already activated', onboardingCompleted: true }, { status: 200 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { activatedAt: new Date(), activationToken: null },
  })

  return NextResponse.json({ message: 'Account activated successfully', userId: user.id }, { status: 200 })
}

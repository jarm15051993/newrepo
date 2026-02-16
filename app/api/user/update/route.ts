import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, lastName, email, phone, birthday, additionalInfo } = body

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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(birthday !== undefined && { birthday: new Date(birthday) }),
        ...(additionalInfo !== undefined && { additionalInfo: additionalInfo.trim() || null }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        lastName: true,
        phone: true,
        birthday: true,
        additionalInfo: true,
        profilePicture: true,
      },
    })

    return NextResponse.json({ user: updated }, { status: 200 })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

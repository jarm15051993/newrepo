import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password!)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isOwner = user.role === 'OWNER'

    const token = await signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.role === 'ADMIN' || isOwner, // deprecated compat
      role: user.role,
      canCreateClass: isOwner || user.canCreateClass,
      canViewStudents: isOwner || user.canViewStudents,
      canValidateAttendance: isOwner || user.canValidateAttendance,
      canBulkUpload: isOwner || user.canBulkUpload,
    })

    const { password: _, isAdmin: __, ...userWithoutPassword } = user

    return NextResponse.json({ token, user: userWithoutPassword }, { status: 200 })
  } catch (error) {
    console.error('Mobile signin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

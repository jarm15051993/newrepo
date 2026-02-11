import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, lastName, phone, birthday, additionalInfo } = body

    // Validate required fields
    if (!email || !password || !name || !lastName || !phone || !birthday) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'email', message: 'An account with this email already exists. Try logging in or restore your password.' },
        { status: 400 }
      )
    }

    // Check if user already exists by phone
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: 'phone', message: 'An account with this phone number already exists. Try logging in or restore your password.' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastName,
        phone,
        birthday: new Date(birthday),
        additionalInfo: additionalInfo || null
      }
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'server', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
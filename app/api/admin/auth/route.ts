import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const sessionSecret = process.env.ADMIN_SESSION_SECRET

  if (!adminEmail || !adminPassword || !sessionSecret) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 })
  }

  if (email !== adminEmail || password !== adminPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const response = NextResponse.json({ message: 'Authenticated' })
  response.cookies.set('admin_session', sessionSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
  return response
}

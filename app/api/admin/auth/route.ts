import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  const sessionSecret = process.env.ADMIN_SESSION_SECRET
  if (!sessionSecret) {
    return NextResponse.json({ error: 'Admin credentials not configured' }, { status: 500 })
  }

  let authorized = false

  if (process.env.ADMIN_CREDENTIALS) {
    try {
      const admins: { email: string; password: string }[] = JSON.parse(process.env.ADMIN_CREDENTIALS)
      authorized = admins.some(a => a.email === email && a.password === password)
    } catch {
      return NextResponse.json({ error: 'Admin credentials misconfigured' }, { status: 500 })
    }
  } else {
    authorized = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD
  }

  if (!authorized) {
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

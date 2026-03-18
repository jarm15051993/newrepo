import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow the login page and auth API through without a session check
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return NextResponse.next()
  }

  // Mobile admin API routes: authenticated via JWT Bearer token — let through, route handles auth
  if (pathname.startsWith('/api/admin') && request.headers.get('authorization')?.startsWith('Bearer ')) {
    return NextResponse.next()
  }

  // Protect all other /admin and /api/admin routes (web admin panel — cookie-based)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = request.cookies.get('admin_session')?.value
    const secret = process.env.ADMIN_SESSION_SECRET

    if (!secret || !session || session !== secret) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}

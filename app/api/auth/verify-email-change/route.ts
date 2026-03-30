import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ''

  if (!token) {
    return NextResponse.redirect(new URL(`${appUrl}/?error=invalid-link`))
  }

  const user = await prisma.user.findUnique({
    where: { emailChangeToken: token },
    select: { id: true, pendingEmail: true, emailChangeTokenExpiresAt: true },
  })

  if (!user?.pendingEmail) {
    return NextResponse.redirect(new URL(`${appUrl}/?error=invalid-link`))
  }

  if (user.emailChangeTokenExpiresAt && user.emailChangeTokenExpiresAt < new Date()) {
    return NextResponse.redirect(new URL(`${appUrl}/?error=link-expired`))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.pendingEmail,
      pendingEmail: null,
      emailChangeToken: null,
      emailChangeTokenExpiresAt: null,
    },
  })

  return NextResponse.redirect(new URL(`${appUrl}/?message=email-updated`))
}

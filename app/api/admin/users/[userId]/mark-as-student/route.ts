import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { sendEmail, type EmailLanguage } from '@/lib/email'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    const isOwner = payload.role === 'OWNER'
    if (!isOwner && !payload.canMarkAsStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isStudent: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ isStudent: user.isStudent })
  } catch (error: any) {
    console.error('[student-status GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)

    // Must be called from within an active tenant session
    const tenantUserId = request.headers.get('x-tenant-user-id')
    if (!tenantUserId) {
      return NextResponse.json({ error: 'This action requires an active tenant session.' }, { status: 400 })
    }

    // Owner always allowed; admins require canMarkAsStudent
    const isOwner = payload.role === 'OWNER'
    if (!isOwner && !payload.canMarkAsStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params
    const { isStudent } = await request.json()
    if (typeof isStudent !== 'boolean') {
      return NextResponse.json({ error: 'isStudent must be a boolean' }, { status: 400 })
    }

    // Can't mark yourself
    if (userId === payload.userId) {
      return NextResponse.json({ error: 'Cannot modify your own student status.' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, language: true },
    })
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (targetUser.role !== 'USER') {
      return NextResponse.json({ error: 'Student status can only be set on regular users.' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isStudent },
    })

    // Fire-and-forget email notification
    const emailType = isStudent ? 'student_status_granted' : 'student_status_removed'
    sendEmail({
      to: targetUser.email,
      type: emailType,
      language: (targetUser.language ?? 'es') as EmailLanguage,
      userId: targetUser.id,
      vars: { name: targetUser.name ?? 'there' },
    }).catch(err => console.error('[mark-as-student] Email error:', err))

    return NextResponse.json({ success: true, isStudent })
  } catch (error: any) {
    console.error('[mark-as-student] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

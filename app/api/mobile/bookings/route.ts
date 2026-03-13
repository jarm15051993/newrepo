import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, extractBearerToken } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    const userId = payload.userId

    const bookings = await prisma.booking.findMany({
      where: {
        userId,
        status: 'confirmed',
        class: {
          startTime: {
            gte: new Date()
          }
        }
      },
      include: {
        class: true
      },
      orderBy: {
        class: {
          startTime: 'asc'
        }
      }
    })

    return NextResponse.json({ bookings })
  } catch (error: any) {
    console.error('[mobile/bookings] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

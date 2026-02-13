import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get all active credits for this user
    const credits = await prisma.userCredit.findMany({
      where: {
        userId,
        creditsRemaining: {
          gt: 0 // Greater than 0
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } } // Not expired
        ]
      }
    })

    // Sum up all remaining credits
    const totalCredits = credits.reduce((sum, credit) => sum + credit.creditsRemaining, 0)

    return NextResponse.json({ 
      totalCredits,
      credits 
    })
  } catch (error: any) {
    console.error('Error fetching credits:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
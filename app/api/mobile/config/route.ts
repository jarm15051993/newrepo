import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    earlyMemberGiftEnabled: process.env.EARLY_MEMBER_GIFT_ENABLED === 'true',
  })
}

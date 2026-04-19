import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractBearerToken } from '@/lib/jwt'
import { getSettings } from '@/lib/settings'

export async function GET(request: NextRequest) {
  try {
    const token = extractBearerToken(request.headers.get('authorization'))
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await verifyToken(token)

    const settings = await getSettings([
      'subscriptionPaymentRequired',
      'subscriptionPrice',
      'membershipRequiredSince',
    ])

    return NextResponse.json({
      subscriptionPaymentRequired: settings.subscriptionPaymentRequired === 'true',
      subscriptionPrice:           parseFloat(settings.subscriptionPrice ?? '10.00'),
      membershipRequiredSince:     settings.membershipRequiredSince ?? null,
    })
  } catch (error: any) {
    console.error('[mobile/settings] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

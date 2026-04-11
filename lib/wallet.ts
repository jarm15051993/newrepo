import { importPKCS8, SignJWT } from 'jose'
import { prisma } from '@/lib/prisma'

/**
 * Triggers a wallet pass sync for the given user.
 *
 * Google Wallet: PATCHes the loyalty object in Google's system so the update
 * propagates to the device automatically.
 *
 * Apple Wallet: The pass generation endpoint already reads live credit data on
 * every GET — no server-push is possible without the full Apple Wallet Web
 * Service + APN infrastructure (not set up). The pass will reflect updated
 * credits the next time the user downloads it.
 *
 * This function never throws — failures are logged silently so the triggering
 * operation (booking, cancellation, purchase) is never affected.
 */
export async function triggerWalletPassUpdate(userId: string): Promise<void> {
  try {
    const credits = await prisma.userCredit.findMany({
      where: {
        userId,
        creditsRemaining: { gt: 0 },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    const totalCredits = credits.reduce((sum, c) => sum + c.creditsRemaining, 0)

    await updateGoogleWalletObject(userId, totalCredits)
  } catch (err) {
    console.error('[wallet] triggerWalletPassUpdate failed for user', userId, err)
  }
}

async function updateGoogleWalletObject(userId: string, totalCredits: number): Promise<void> {
  const credsRaw = process.env.GOOGLE_WALLET_CREDENTIALS
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID
  if (!credsRaw || !issuerId) return // Google Wallet not configured — skip silently

  const credentials = JSON.parse(credsRaw)
  const objectId = `${issuerId}.user_${userId.replace(/[^a-zA-Z0-9_.-]/g, '_')}`

  // Get a service-account access token via the JWT Bearer flow
  const privateKey = await importPKCS8(credentials.private_key, 'RS256')
  const now = Math.floor(Date.now() / 1000)

  const assertionJwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
    aud: 'https://oauth2.googleapis.com/token',
    iss: credentials.client_email,
    iat: now,
    exp: now + 3600,
  })
    .setProtectedHeader({ alg: 'RS256' })
    .sign(privateKey)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertionJwt,
    }),
  })

  if (!tokenRes.ok) {
    console.error('[wallet] Google token exchange failed:', await tokenRes.text())
    return
  }

  const { access_token } = await tokenRes.json()

  // PATCH the loyalty object with the updated credit balance
  const patchRes = await fetch(
    `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${encodeURIComponent(objectId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loyaltyPoints: {
          balance: { string: String(totalCredits) },
          label: 'Classes Left',
        },
      }),
    }
  )

  if (!patchRes.ok) {
    const body = await patchRes.text()
    // 404 means the object hasn't been saved to any device yet — not an error
    if (patchRes.status !== 404) {
      console.error('[wallet] Google Wallet PATCH failed:', patchRes.status, body)
    }
  }
}

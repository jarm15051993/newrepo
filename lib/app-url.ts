/**
 * Returns the base URL of the app.
 * - Local dev:  http://localhost:3000 (or whatever port)
 * - Vercel:     uses VERCEL_URL automatically if NEXT_PUBLIC_APP_URL is not set
 * - Production: always set NEXT_PUBLIC_APP_URL in your deployment platform
 */
export function getAppUrl(): string {
  // Explicit override always wins (set this in your production platform)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Vercel injects VERCEL_URL automatically (no https:// prefix)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Local development fallback
  return 'http://localhost:3000'
}

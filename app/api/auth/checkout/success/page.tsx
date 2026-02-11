'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function CheckoutSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // TODO: Verify payment and add credits to user
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    }
  }, [sessionId, router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-amber-400 mb-4">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">
          Your class credits have been added to your account.
        </p>
        <p className="text-gray-400 text-sm">
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  )
}
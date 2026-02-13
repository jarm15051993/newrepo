'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

export default function CheckoutSuccess() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [verifying, setVerifying] = useState(true)
  const [creditsAdded, setCreditsAdded] = useState(0)

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        router.push('/packages')
        return
      }

      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })

        const data = await response.json()

        if (response.ok) {
          setCreditsAdded(data.creditsAdded || 0)
          setVerifying(false)
          
          // Redirect after 3 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          console.error('Payment verification failed:', data.error)
          setVerifying(false)
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [sessionId, router])

  if (verifying) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md">
          <div className="text-4xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-amber-400 mb-4">Verifying Payment...</h1>
          <p className="text-gray-400">Please wait while we confirm your purchase.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md">
        <div className="text-6xl mb-4">✓</div>
        <h1 className="text-3xl font-bold text-amber-400 mb-4">Payment Successful!</h1>
        <p className="text-gray-300 mb-2">
          <span className="text-amber-400 font-bold">{creditsAdded}</span> {creditsAdded === 1 ? 'class credit has' : 'class credits have'} been added to your account.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Your credits are valid for 6 months.
        </p>
        <p className="text-gray-400 text-sm mb-6">
          Redirecting to dashboard in 3 seconds...
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg transition"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  )
}
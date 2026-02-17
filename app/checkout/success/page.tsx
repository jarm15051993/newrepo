'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!sessionId) {
      router.push('/packages')
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        })

        const data = await response.json()

        if (response.ok) {
          setCreditsAdded(data.creditsAdded || 0)
          setStatus('success')
        } else {
          console.error('Payment verification failed:', data.error)
          setStatus('error')
        }
      } catch (error) {
        console.error('Error verifying payment:', error)
        setStatus('error')
      }
    }

    verifyPayment()
  }, [sessionId, router])

  // Countdown + redirect once verified
  useEffect(() => {
    if (status !== 'success') return

    if (countdown <= 0) {
      router.push('/dashboard')
      return
    }

    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [status, countdown, router])

  if (status === 'verifying') {
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

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-amber-400 mb-4">Verification Issue</h1>
          <p className="text-gray-400 mb-6">
            Your payment may have completed but we couldn't confirm it automatically. Your credits will appear in your dashboard shortly.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg transition"
          >
            Go to Dashboard
          </button>
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
          <span className="text-amber-400 font-bold">{creditsAdded}</span>{' '}
          {creditsAdded === 1 ? 'class credit has' : 'class credits have'} been added to your account.
        </p>
        <p className="text-gray-400 text-sm mb-6">Your credits are valid for 6 months.</p>
        <p className="text-gray-400 text-sm mb-6">
          Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
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

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center max-w-md">
            <div className="text-4xl mb-4">⏳</div>
            <h1 className="text-2xl font-bold text-amber-400 mb-4">Loading...</h1>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}
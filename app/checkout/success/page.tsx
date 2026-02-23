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
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-warm-white rounded-2xl p-8 border border-rule text-center max-w-md shadow-sm">
          <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-serif font-light text-burg mb-4 tracking-wide">Verifying Payment…</h1>
          <p className="text-mgray text-sm">Please wait while we confirm your purchase.</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-warm-white rounded-2xl p-8 border border-rule text-center max-w-md shadow-sm">
          <div className="w-14 h-14 bg-burg-pale/20 border border-burg-pale rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-light text-burg mb-4 tracking-wide">Verification Issue</h1>
          <p className="text-mgray mb-6 text-sm leading-relaxed">
            Your payment may have completed but we couldn&apos;t confirm it automatically. Your credits will appear in your dashboard shortly.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-ink hover:bg-burg text-warm-white font-medium rounded-lg transition tracking-wider text-sm uppercase"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-warm-white rounded-2xl p-8 border border-rule text-center max-w-md shadow-sm">
        <div className="w-14 h-14 bg-bone rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-serif font-light text-burg mb-4 tracking-wide">Payment Successful</h1>
        <p className="text-ink mb-2 text-sm">
          <span className="text-burg font-medium text-lg">{creditsAdded}</span>{' '}
          {creditsAdded === 1 ? 'class credit has' : 'class credits have'} been added to your account.
        </p>
        <p className="text-mgray text-sm mb-6">Your credits are valid for 1 month.</p>
        <p className="text-mgray text-sm mb-6">
          Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}…
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-ink hover:bg-burg text-warm-white font-medium rounded-lg transition tracking-wider text-sm uppercase"
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
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  )
}

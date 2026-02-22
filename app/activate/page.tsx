'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ActivateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Invalid activation link.')
      return
    }

    fetch(`/api/auth/activate?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
        } else if (data.onboardingCompleted) {
          setStatus('success')
          setMessage('Account already activated. Redirecting to login…')
          setTimeout(() => router.push('/login'), 2000)
        } else if (data.userId) {
          setStatus('success')
          setMessage(data.message || 'Account activated successfully!')
          setTimeout(() => router.push(`/onboarding?userId=${data.userId}`), 1500)
        } else {
          setStatus('error')
          setMessage('Something went wrong. Please try again.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="bg-warm-white rounded-2xl p-10 w-full max-w-md border border-rule text-center shadow-sm">
        <h1 className="text-3xl font-serif font-light text-burg mb-6 tracking-wide">OOMA Wellness Club</h1>

        {status === 'loading' && (
          <>
            <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-mgray">Activating your account…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 bg-bone rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-700 font-medium text-lg">{message}</p>
            <p className="text-mgray text-sm mt-2">Just a moment…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 bg-burg-pale/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-burg font-medium text-lg">{message}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 px-6 py-2 bg-ink hover:bg-burg text-warm-white font-medium rounded-lg transition tracking-wider text-sm uppercase"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ActivateContent />
    </Suspense>
  )
}

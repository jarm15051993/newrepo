'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const toastStyle = (border: string) => ({
  background: '#1a1a1a',
  color: '#fbbf24',
  border: `1px solid ${border}`,
})

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [loginFailed, setLoginFailed] = useState(false)
  const [notActivated, setNotActivated] = useState(false)
  const [onboardingIncomplete, setOnboardingIncomplete] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  // Forgot-password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setNotActivated(false)
    setOnboardingIncomplete(null)
    setResendSent(false)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'not_activated') {
          setNotActivated(true)
          setLoginFailed(false)
          setOnboardingIncomplete(null)
        } else if (data.error === 'onboarding_incomplete') {
          setOnboardingIncomplete(data.userId)
          setNotActivated(false)
          setLoginFailed(false)
        } else {
          toast.error(data.error || 'Invalid credentials', { duration: 4000, style: toastStyle('#ef4444') })
          setLoginFailed(true)
          setNotActivated(false)
          setOnboardingIncomplete(null)
        }
        setLoading(false)
        return
      }

      localStorage.setItem('user', JSON.stringify(data.user))
      setLoginFailed(false)
      setNotActivated(false)

      toast.success('Login successful!', { duration: 2000, style: toastStyle('#22c55e') })
      setTimeout(() => router.push('/dashboard'), 1000)
    } catch {
      toast.error('Network error. Please try again.', { duration: 4000, style: toastStyle('#ef4444') })
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleResendActivation = async () => {
    setResendLoading(true)
    try {
      await fetch('/api/auth/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      setResendSent(true)
    } catch {
      toast.error('Network error. Please try again.', { style: toastStyle('#ef4444') })
    } finally {
      setResendLoading(false)
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotSent(true)
    } catch {
      toast.error('Network error. Please try again.', { style: toastStyle('#ef4444') })
    } finally {
      setForgotLoading(false)
    }
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotEmail('')
    setForgotSent(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Toaster position="top-center" />

      <div className="bg-black rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-2 text-amber-400">OOMA Wellness Club</h1>
        <p className="text-center text-gray-400 mb-6">Welcome back</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Password *</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
            {loginFailed && !notActivated && (
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="mt-1.5 text-sm text-amber-400 hover:underline"
              >
                Forgot my password?
              </button>
            )}
          </div>

          {/* Account not activated banner */}
          {notActivated && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3 space-y-2">
              <p className="text-amber-400 text-sm font-medium">Account not activated</p>
              <p className="text-gray-400 text-xs">
                Please check your email for the activation link before logging in.
              </p>
              {resendSent ? (
                <p className="text-green-400 text-xs">A new activation link has been sent!</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendActivation}
                  disabled={resendLoading}
                  className="text-xs text-amber-400 hover:underline disabled:opacity-50"
                >
                  {resendLoading ? 'Sending…' : 'Resend activation email'}
                </button>
              )}
            </div>
          )}

          {/* Onboarding not complete banner */}
          {onboardingIncomplete && (
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-4 py-3 space-y-2">
              <p className="text-amber-400 text-sm font-medium">Profile setup incomplete</p>
              <p className="text-gray-400 text-xs">
                You haven&apos;t finished setting up your profile yet.
              </p>
              <a
                href={`/onboarding?userId=${onboardingIncomplete}`}
                className="text-xs text-amber-400 hover:underline"
              >
                Complete your profile setup →
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-amber-400 hover:underline font-semibold">
            Sign up
          </a>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-400">Reset Password</h2>
              <button onClick={closeForgotModal} className="text-gray-500 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-medium">Check your inbox</p>
                <p className="text-gray-400 text-sm mt-1">
                  If that email is registered, a reset link has been sent.
                </p>
                <button
                  onClick={closeForgotModal}
                  className="mt-5 w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

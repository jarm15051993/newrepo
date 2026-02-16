'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const toastStyle = (border: string) => ({
  background: '#1a1a1a',
  color: '#fbbf24',
  border: `1px solid ${border}`,
})

function validatePassword(password: string): string {
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one capital letter'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character'
  return ''
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const err = validatePassword(password)
    if (err) { toast.error(err, { style: toastStyle('#ef4444') }); return }
    if (password !== confirm) { toast.error('Passwords do not match', { style: toastStyle('#ef4444') }); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Reset failed', { style: toastStyle('#ef4444') })
        setLoading(false)
        return
      }

      toast.success('Password reset! Redirecting to login…', { duration: 2500, style: toastStyle('#22c55e') })
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      toast.error('Network error. Please try again.', { style: toastStyle('#ef4444') })
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="bg-gray-900 rounded-2xl p-10 w-full max-w-md border border-gray-800 text-center">
          <h1 className="text-3xl font-bold text-amber-400 mb-4">OOMA Wellness Club</h1>
          <p className="text-red-400">Invalid or missing reset link.</p>
          <button onClick={() => router.push('/login')} className="mt-6 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg transition">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Toaster position="top-center" />
      <div className="bg-black rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-2 text-amber-400">OOMA Wellness Club</h1>
        <p className="text-center text-gray-400 mb-6">Set a new password</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">New Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
            <p className="text-xs text-gray-400 mt-1">At least 8 characters, one capital letter, and one special character</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

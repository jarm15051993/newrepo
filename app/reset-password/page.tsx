'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const toastStyle = (border: string) => ({
  background: '#FAFAF7',
  color: '#1A1512',
  border: `1px solid ${border}`,
})

function validatePassword(password: string): string {
  if (password.length < 8) return 'Password must be at least 8 characters long'
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one capital letter'
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character'
  return ''
}

const inputClass = 'w-full px-4 py-2 bg-warm-white border border-rule rounded-lg focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray'

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
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <div className="bg-warm-white rounded-2xl p-10 w-full max-w-md border border-rule text-center shadow-sm">
          <h1 className="text-3xl font-serif font-light text-burg mb-4 tracking-wide">OOMA Wellness Club</h1>
          <p className="text-burg">Invalid or missing reset link.</p>
          <button onClick={() => router.push('/login')} className="mt-6 px-6 py-2 bg-ink hover:bg-burg text-warm-white font-medium rounded-lg transition tracking-wider text-sm uppercase">
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <Toaster position="top-center" />
      <div className="bg-warm-white rounded-2xl shadow-sm p-8 w-full max-w-md border border-rule">
        <h1 className="text-3xl font-serif font-light text-center mb-2 text-burg tracking-wide">OOMA Wellness Club</h1>
        <p className="text-center text-mgray mb-6 text-sm tracking-wider uppercase">Set a new password</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1 tracking-wide">New Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
            />
            <p className="text-xs text-mgray mt-1">At least 8 characters, one capital letter, and one special character</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1 tracking-wide">Confirm Password *</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-burg text-warm-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm uppercase"
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
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

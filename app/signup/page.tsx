'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const toastStyle = (border: string) => ({
  background: '#FAFAF7',
  color: '#1A1512',
  border: `1px solid ${border}`,
})

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.message || 'Something went wrong', { duration: 5000, style: toastStyle('#ef4444') })
        setLoading(false)
        return
      }
      router.push('/signup/success')
    } catch {
      toast.error('Network error. Please try again.', { duration: 4000, style: toastStyle('#ef4444') })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <Toaster position="top-center" />

      <div className="bg-warm-white rounded-2xl shadow-sm p-8 w-full max-w-md border border-rule">
        <h1 className="text-3xl font-serif font-light text-center mb-2 text-burg tracking-wide">OOMA Wellness Club</h1>
        <p className="text-center text-mgray mb-8 text-sm tracking-wider uppercase">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1 tracking-wide">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-warm-white border border-rule rounded-lg focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-burg text-warm-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm uppercase"
          >
            {loading ? 'Sending link…' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-mgray mt-4 text-sm">
          Already have an account?{' '}
          <a href="/login" className="text-burg hover:underline font-medium">Log in</a>
        </p>
      </div>
    </div>
  )
}

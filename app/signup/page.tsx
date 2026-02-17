'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const toastStyle = (border: string) => ({
  background: '#1a1a1a',
  color: '#fbbf24',
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
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Toaster position="top-center" />

      <div className="bg-black rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-2 text-amber-400">OOMA Wellness Club</h1>
        <p className="text-center text-gray-400 mb-8">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending link…' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-amber-400 hover:underline font-semibold">Log in</a>
        </p>
      </div>
    </div>
  )
}

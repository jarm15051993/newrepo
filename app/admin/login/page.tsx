'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Invalid credentials')
        return
      }
      router.replace('/admin')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <div className="bg-warm-white rounded-2xl shadow-sm p-8 w-full max-w-sm border border-rule">
        <h1 className="text-2xl font-serif font-light text-center text-burg mb-1 tracking-wide">Admin Panel</h1>
        <p className="text-center text-mgray text-sm mb-6 tracking-wider uppercase">OOMA Wellness Club</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1 tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-warm-white border border-rule rounded-lg focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1 tracking-wide">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-warm-white border border-rule rounded-lg focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray"
            />
          </div>

          {error && (
            <p className="text-burg text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-burg text-warm-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 tracking-wider text-sm uppercase"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

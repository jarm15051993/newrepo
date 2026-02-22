'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

const PACKAGES = [
  {
    id: '1',
    name: '1 Class',
    classes: 1,
    price: 10,
    description: 'Perfect for trying out OOMA'
  },
  {
    id: '2',
    name: '2 Classes',
    classes: 2,
    price: 15,
    description: 'Save €5 per class'
  },
  {
    id: '3',
    name: '5 Classes',
    classes: 5,
    price: 35,
    description: 'Best value - Save €15!'
  }
]

export default function PackagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')

    if (!userData) {
      toast.error('Please log in to purchase classes', {
        style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #ef4444' },
      })
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
  }, [router])

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId,
          userId: user.id,
          userEmail: user.email
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (!data.url) {
        throw new Error('No checkout URL returned')
      }

      window.location.href = data.url
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong. Please try again.', {
        style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #ef4444' },
      })
      setSelectedPackage(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream p-8">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-mgray hover:text-burg mb-4 flex items-center gap-2 text-sm tracking-wide"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-serif font-light text-ink mb-2 tracking-wide">Choose Your <em className="text-burg">Package</em></h1>
          <p className="text-mgray text-sm">Select the perfect class package for your wellness journey</p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-warm-white rounded-2xl p-8 border border-rule hover:border-burg transition-all"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif font-light text-ink mb-2 tracking-wide">{pkg.name}</h2>
                <p className="text-mgray text-sm">{pkg.description}</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-serif font-light text-burg mb-2">
                  €{pkg.price}
                </div>
                <div className="text-mgray text-sm">
                  {pkg.classes} {pkg.classes === 1 ? 'class' : 'classes'}
                </div>
                {pkg.classes > 1 && (
                  <div className="text-sm text-green-700 mt-2">
                    €{(pkg.price / pkg.classes).toFixed(2)} per class
                  </div>
                )}
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-ink">
                  <svg className="w-5 h-5 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Full access to studio</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <svg className="w-5 h-5 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">All equipment included</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <svg className="w-5 h-5 text-burg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Expert instructors</span>
                </div>
                {pkg.classes >= 5 && (
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Priority booking</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={selectedPackage === pkg.id}
                className="w-full bg-ink hover:bg-burg text-warm-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm uppercase"
              >
                {selectedPackage === pkg.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-12 bg-warm-white rounded-2xl p-6 border border-rule">
          <h3 className="text-xl font-serif font-light text-burg mb-3 tracking-wide">Payment Information</h3>
          <ul className="space-y-2 text-ink text-sm">
            <li className="flex items-start gap-2">
              <span className="text-burg mt-1">·</span>
              <span>Secure payment processing via Stripe</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-burg mt-1">·</span>
              <span>Classes are valid for 6 months from purchase date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-burg mt-1">·</span>
              <span>All prices are in Euros (€)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-burg mt-1">·</span>
              <span>Credits will be added to your account immediately after payment</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

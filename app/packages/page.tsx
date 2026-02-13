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
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    
    if (!userData) {
      // Not logged in, redirect to login
      toast.error('Please log in to purchase classes', {
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
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
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
      })
      setSelectedPackage(null)
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 hover:text-amber-400 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-bold text-amber-400 mb-2">Choose Your Package</h1>
          <p className="text-gray-400">Select the perfect class package for your wellness journey</p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-amber-400 transition-all"
            >
              {/* Package Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{pkg.name}</h2>
                <p className="text-gray-400 text-sm">{pkg.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-amber-400 mb-2">
                  €{pkg.price}
                </div>
                <div className="text-gray-400">
                  {pkg.classes} {pkg.classes === 1 ? 'class' : 'classes'}
                </div>
                {pkg.classes > 1 && (
                  <div className="text-sm text-green-400 mt-2">
                    €{(pkg.price / pkg.classes).toFixed(2)} per class
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Full access to studio
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All equipment included
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Expert instructors
                </div>
                {pkg.classes >= 5 && (
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Priority booking
                  </div>
                )}
              </div>

              {/* Buy Button */}
              <button
                onClick={() => handlePurchase(pkg.id)}
                disabled={selectedPackage === pkg.id}
                className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPackage === pkg.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mt-12 bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-amber-400 mb-3">Payment Information</h3>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">•</span>
              <span>Secure payment processing via Stripe</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">•</span>
              <span>Classes are valid for 6 months from purchase date</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">•</span>
              <span>All prices are in Euros (€)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 mt-1">•</span>
              <span>Credits will be added to your account immediately after payment</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
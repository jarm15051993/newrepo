'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    lastName: '',
    phone: '',
    countryCode: '+52',
    birthday: '',
    additionalInfo: ''
  })
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const validatePassword = (password: string) => {
    // At least 8 characters
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }

    // Has at least one capital letter
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one capital letter'
    }

    // Has at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character'
    }

    return ''
  }

  const validatePhone = (phone: string) => {
    // Only numbers allowed
    if (!/^\d*$/.test(phone)) {
      return 'Phone number can only contain numbers'
    }

    // Exactly 10 digits
    if (phone.length !== 10 && phone.length > 0) {
      return 'Phone number must be exactly 10 digits'
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password before submitting
    const passwordValidationError = validatePassword(formData.password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      toast.error(passwordValidationError, {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
      })
      return
    }

    // Validate phone before submitting
    const phoneValidationError = validatePhone(formData.phone)
    if (phoneValidationError) {
      setPhoneError(phoneValidationError)
      toast.error(phoneValidationError, {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
      })
      return
    }

    if (formData.phone.length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits')
      toast.error('Phone number must be exactly 10 digits', {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
      })
      return
    }

    setLoading(true)

    try {
      // Combine country code with phone number
      const fullPhone = formData.countryCode + formData.phone

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: fullPhone
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Show context-aware error message
        toast.error(data.message || 'Something went wrong', {
          duration: 5000,
          style: {
            background: '#1a1a1a',
            color: '#fbbf24',
            border: '1px solid #ef4444',
          },
        })
        setLoading(false)
        return
      }

      router.push('/signup/success')
    } catch (err) {
      toast.error('Network error. Please try again.', {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
      })
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })

    // Clear password error when user starts typing
    if (e.target.name === 'password') {
      setPasswordError('')
    }

    // Clear phone error when user starts typing
    if (e.target.name === 'phone') {
      setPhoneError('')
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Only allow numbers and max 10 digits
    if (!/^\d*$/.test(value)) {
      setPhoneError('Only numbers are allowed')
      return
    }

    if (value.length > 10) {
      return // Don't update if more than 10 digits
    }

    setFormData({
      ...formData,
      phone: value
    })

    setPhoneError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Toaster position="top-center" />
      
      <div className="bg-black rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-800">
        <h1 className="text-3xl font-bold text-center mb-2 text-amber-400">OOMA Wellness Club</h1>
        <p className="text-center text-gray-400 mb-6">Create your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Email *
            </label>
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
            <label className="block text-sm font-medium text-white mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-black border ${
                passwordError ? 'border-red-500' : 'border-gray-700'
              } rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600`}
            />
            <p className="text-xs text-gray-400 mt-1">
              At least 8 characters, one capital letter, and one special character
            </p>
            {passwordError && (
              <p className="text-xs text-red-400 mt-1">{passwordError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Phone *
            </label>
            <div className="flex gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="px-3 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400"
              >
                <option value="+52">🇲🇽 +52</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+34">🇪🇸 +34</option>
              </select>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="1234567890"
                maxLength={10}
                className={`flex-1 px-4 py-2 bg-black border ${
                  phoneError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              10 digits, numbers only
            </p>
            {phoneError && (
              <p className="text-xs text-red-400 mt-1">{phoneError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Birthday *
            </label>
            <input
              type="date"
              name="birthday"
              required
              value={formData.birthday}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              More Info (Optional)
            </label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-amber-400 hover:underline font-semibold">
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { COUNTRY_CODES } from '@/lib/constants'

const toastStyle = (border: string) => ({
  background: '#1a1a1a',
  color: '#fbbf24',
  border: `1px solid ${border}`,
})

interface FormState {
  password: string
  confirmPassword: string
  name: string
  lastName: string
  countryCode: string
  phone: string
  goals: string
  birthday: string
  additionalInfo: string
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [form, setForm] = useState<FormState>({
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    countryCode: '+52',
    phone: '',
    goals: '',
    birthday: '',
    additionalInfo: '',
  })

  useEffect(() => {
    if (!userId) {
      router.replace('/signup')
    }
  }, [userId, router])

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handlePhoneInput = (value: string) => {
    if (!/^\d*$/.test(value)) {
      setPhoneError('Only digits are allowed — no spaces, dashes, or symbols')
      return
    }
    setPhoneError('')
    if (value.length > 15) return
    set('phone', value)
  }

  const handlePhoneBlur = () => {
    if (!form.phone.trim()) {
      setPhoneError('Phone number is required')
    } else {
      setPhoneError('')
    }
  }

  const validateStep = (): string | null => {
    if (step === 0) {
      if (form.password.length < 8) return 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one capital letter'
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return 'Password must contain at least one special character'
      if (form.password !== form.confirmPassword) return 'Passwords do not match'
    }
    if (step === 1) {
      if (!form.name.trim()) return 'First name is required'
      if (!form.lastName.trim()) return 'Last name is required'
    }
    if (step === 2) {
      if (!form.phone.trim()) {
        setPhoneError('Phone number is required')
        return 'Phone number is required'
      }
      if (!/^\d+$/.test(form.phone)) {
        setPhoneError('Only digits are allowed — no spaces, dashes, or symbols')
        return 'Phone must contain digits only'
      }
    }
    if (step === 3) {
      if (!form.goals.trim()) return 'Please tell us your goal'
    }
    if (step === 4) {
      if (!form.birthday) return 'Birthday is required'
    }
    return null
  }

  const handleNext = async () => {
    const error = validateStep()
    if (error) {
      toast.error(error, { duration: 3000, style: toastStyle('#ef4444') })
      return
    }

    // Phone step: check uniqueness before advancing
    if (step === 2) {
      const fullPhone = form.countryCode + form.phone
      try {
        const res = await fetch(`/api/user/check-phone?phone=${encodeURIComponent(fullPhone)}&excludeUserId=${userId}`)
        const data = await res.json()
        if (!data.available) {
          const msg = 'That phone number is already registered.'
          setPhoneError(msg)
          toast.error(msg, { duration: 3000, style: toastStyle('#ef4444') })
          return
        }
      } catch {
        // network error — let it pass; API will catch it at submit
      }
    }

    if (step < 4) {
      setStep(s => s + 1)
      return
    }

    // Final step — submit
    setLoading(true)
    try {
      const fullPhone = form.countryCode + form.phone
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password: form.password,
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          phone: fullPhone,
          goals: form.goals.trim(),
          birthday: form.birthday,
          additionalInfo: form.additionalInfo.trim() || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.message || 'Something went wrong', { duration: 4000, style: toastStyle('#ef4444') })
        setLoading(false)
        return
      }
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Welcome to OOMA Wellness!', { duration: 2000, style: toastStyle('#22c55e') })
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      toast.error('Network error. Please try again.', { duration: 4000, style: toastStyle('#ef4444') })
      setLoading(false)
    }
  }

  const inputClass = (hasError = false) =>
    `w-full px-4 py-2 bg-black border ${hasError ? 'border-red-500' : 'border-gray-700'} rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600`

  const STEPS = [
    'Create your password',
    'Yourself',
    'How can we reach you',
    "What's your goal",
    'Tell us about yourself',
  ]

  if (!userId) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Toaster position="top-center" />

      <div className="bg-black rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-800">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center text-amber-400 mb-1">OOMA Wellness Club</h1>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-amber-400' : i < step ? 'w-2 bg-amber-400/60' : 'w-2 bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Step title */}
        <h2 className="text-xl font-semibold text-white mb-6 text-center">{STEPS[step]}</h2>

        {/* Step content */}
        <div className="space-y-4">

          {/* Step 0: Password */}
          {step === 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass()} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">8+ characters, one capital, one special character</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass(form.confirmPassword.length > 0 && form.password !== form.confirmPassword)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-400 transition"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            </>
          )}

          {/* Step 1: Name */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-1">First Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Maria"
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => set('lastName', e.target.value)}
                  placeholder="García"
                  className={inputClass()}
                />
              </div>
            </>
          )}

          {/* Step 2: Phone */}
          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">Phone Number *</label>
              <div className="flex gap-2">
                <select
                  value={form.countryCode}
                  onChange={e => set('countryCode', e.target.value)}
                  className="px-3 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 text-sm"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handlePhoneInput(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="1234567890"
                  className={`flex-1 ${inputClass(!!phoneError)}`}
                />
              </div>
              {phoneError
                ? <p className="text-xs text-red-400 mt-1">{phoneError}</p>
                : <p className="text-xs text-gray-500 mt-1">Digits only, no spaces or dashes</p>
              }
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-white mb-1">Your goal *</label>
              <textarea
                value={form.goals}
                onChange={e => set('goals', e.target.value)}
                rows={4}
                placeholder="e.g. Improve flexibility, lose weight, reduce stress…"
                className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600 resize-none"
              />
            </div>
          )}

          {/* Step 4: Birthday + Health notes */}
          {step === 4 && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Birthday *</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={e => set('birthday', e.target.value)}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">
                  Health notes <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={form.additionalInfo}
                  onChange={e => set('additionalInfo', e.target.value)}
                  rows={3}
                  placeholder="Injuries, pregnancy, medical conditions, allergies…"
                  className="w-full px-4 py-2 bg-black border border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent text-amber-400 placeholder-gray-600 resize-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 border border-gray-700 text-gray-300 font-semibold rounded-lg hover:border-amber-400 hover:text-amber-400 transition"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-amber-400 hover:bg-amber-500 text-black font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : step === 4 ? "Let's go!" : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

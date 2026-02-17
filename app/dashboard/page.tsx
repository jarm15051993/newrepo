'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Booking {
  id: string
  classId: string
  stretcherNumber: number
  class: {
    title: string
    startTime: string
    endTime: string
    instructor: string | null
  }
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.heif']

const COUNTRY_CODES = [
  { code: '+1',   label: '+1 (US/Canada)' },
  { code: '+52',  label: '+52 (Mexico)' },
  { code: '+54',  label: '+54 (Argentina)' },
  { code: '+55',  label: '+55 (Brazil)' },
  { code: '+56',  label: '+56 (Chile)' },
  { code: '+57',  label: '+57 (Colombia)' },
  { code: '+51',  label: '+51 (Peru)' },
  { code: '+58',  label: '+58 (Venezuela)' },
  { code: '+593', label: '+593 (Ecuador)' },
  { code: '+595', label: '+595 (Paraguay)' },
  { code: '+598', label: '+598 (Uruguay)' },
  { code: '+507', label: '+507 (Panama)' },
  { code: '+506', label: '+506 (Costa Rica)' },
  { code: '+503', label: '+503 (El Salvador)' },
  { code: '+502', label: '+502 (Guatemala)' },
  { code: '+504', label: '+504 (Honduras)' },
  { code: '+505', label: '+505 (Nicaragua)' },
  { code: '+53',  label: '+53 (Cuba)' },
  { code: '+44',  label: '+44 (UK)' },
  { code: '+34',  label: '+34 (Spain)' },
  { code: '+33',  label: '+33 (France)' },
  { code: '+49',  label: '+49 (Germany)' },
  { code: '+39',  label: '+39 (Italy)' },
  { code: '+61',  label: '+61 (Australia)' },
  { code: '+91',  label: '+91 (India)' },
  { code: '+81',  label: '+81 (Japan)' },
  { code: '+82',  label: '+82 (South Korea)' },
  { code: '+86',  label: '+86 (China)' },
]

function parsePhone(phone: string): { code: string; number: string } {
  if (!phone) return { code: '+1', number: '' }
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
  for (const { code } of sorted) {
    if (phone.startsWith(code)) {
      return { code, number: phone.slice(code.length) }
    }
  }
  return { code: '+1', number: phone.replace(/\D/g, '') }
}

const inputClass = 'bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-base focus:outline-none focus:border-amber-400'

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
    </svg>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalCredits, setTotalCredits] = useState(0)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [pictureVersion, setPictureVersion] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Per-field inline editing
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editPhoneCode, setEditPhoneCode] = useState('+1')
  const [editPhoneNumber, setEditPhoneNumber] = useState('')
  const [fieldSaving, setFieldSaving] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (file: File) => {
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
      setUploadError('Only .png, .jpg, .jpeg, .heic, and .heif files are allowed')
      setUploadStatus('error')
      return
    }

    setUploadStatus('uploading')
    setUploadError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)

    try {
      const response = await fetch('/api/user/profile-picture', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setProfilePicture(data.profilePicture)
      setPictureVersion(v => v + 1)
      setUploadStatus('success')

      const stored = localStorage.getItem('user')
      if (stored) {
        const updated = { ...JSON.parse(stored), profilePicture: data.profilePicture }
        localStorage.setItem('user', JSON.stringify(updated))
        setUser(updated)
      }
    } catch (error: any) {
      setUploadError(error.message || 'Upload failed. Please try again.')
      setUploadStatus('error')
    }
  }, [user])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = localStorage.getItem('user')

      if (!userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setProfilePicture(parsedUser.profilePicture || null)

      try {
        const creditsResponse = await fetch(`/api/user/credits?userId=${parsedUser.id}`)
        const creditsData = await creditsResponse.json()
        if (creditsResponse.ok) setTotalCredits(creditsData.totalCredits || 0)

        const bookingsResponse = await fetch(`/api/user/bookings?userId=${parsedUser.id}`)
        const bookingsData = await bookingsResponse.json()
        if (bookingsResponse.ok) setUpcomingBookings(bookingsData.bookings || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }

      setLoading(false)
    }

    fetchUserData()

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchUserData()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  const startEditField = (field: string) => {
    setEditingField(field)
    setFieldError(null)
    if (field === 'phone') {
      const parsed = parsePhone(user.phone || '')
      setEditPhoneCode(parsed.code)
      setEditPhoneNumber(parsed.number)
    } else if (field === 'birthday') {
      setEditValue(user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '')
    } else {
      setEditValue(user[field] || '')
    }
  }

  const cancelEditField = () => {
    setEditingField(null)
    setFieldError(null)
  }

  const saveField = async (field: string) => {
    setFieldSaving(true)
    setFieldError(null)

    const value = field === 'phone' ? `${editPhoneCode}${editPhoneNumber}` : editValue

    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, [field]: value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Update failed')

      const updated = { ...user, ...data.user }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setEditingField(null)
    } catch (error: any) {
      setFieldError(error.message || 'Update failed. Please try again.')
    } finally {
      setFieldSaving(false)
    }
  }

  const handleCancelBooking = async (booking: Booking) => {
    setCancellingId(booking.id)
    try {
      const response = await fetch('/api/classes/book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, classId: booking.classId })
      })

      if (response.ok) {
        setUpcomingBookings(prev => prev.filter(b => b.id !== booking.id))
        setTotalCredits(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
    setCancellingId(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  // Reusable inline field row
  const FieldRow = ({
    field,
    label,
    display,
    editContent,
  }: {
    field: string
    label: string
    display: React.ReactNode
    editContent: React.ReactNode
  }) => (
    <div className="group">
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        {editingField !== field && (
          <button
            onClick={() => startEditField(field)}
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-amber-400 transition-opacity"
            title={`Edit ${label}`}
          >
            <PencilIcon />
          </button>
        )}
      </div>

      {editingField === field ? (
        <div className="space-y-2">
          {editContent}
          {fieldError && <p className="text-red-400 text-xs">{fieldError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => saveField(field)}
              disabled={fieldSaving}
              className="px-3 py-1 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-400/50 text-black text-sm font-semibold rounded-lg transition"
            >
              {fieldSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={cancelEditField}
              disabled={fieldSaving}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white text-base">{display}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400">OOMA Wellness Club</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-6">
          <h2 className="text-2xl font-bold text-amber-400 mb-6">My Profile</h2>

          {/* Profile Picture */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-400 mb-3">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex-shrink-0 w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 transition-colors ${
                  isDragging ? 'border-amber-400' : 'border-gray-700 hover:border-amber-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.heic,.heif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/user/profile-picture?userId=${user?.id}&v=${pictureVersion}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                  uploadStatus === 'uploading' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {uploadStatus === 'uploading' ? (
                    <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Click or drag a photo to upload</p>
                <p className="text-gray-600 text-xs mt-1">.png, .jpg, .jpeg, .heic, .heif — max 10MB</p>
              </div>
            </div>
            {uploadStatus === 'success' && (
              <p className="mt-2 text-green-400 text-sm">Profile picture updated!</p>
            )}
            {uploadStatus === 'error' && uploadError && (
              <p className="mt-2 text-red-400 text-sm">{uploadError}</p>
            )}
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldRow
              field="name"
              label="First Name"
              display={user.name}
              editContent={
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              }
            />

            <FieldRow
              field="lastName"
              label="Last Name"
              display={user.lastName}
              editContent={
                <input
                  type="text"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              }
            />

            <FieldRow
              field="email"
              label="Email"
              display={user.email}
              editContent={
                <input
                  type="email"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              }
            />

            <FieldRow
              field="phone"
              label="Phone"
              display={user.phone}
              editContent={
                <div className="flex gap-2">
                  <select
                    value={editPhoneCode}
                    onChange={e => setEditPhoneCode(e.target.value)}
                    className={`${inputClass} flex-shrink-0`}
                  >
                    {COUNTRY_CODES.map(({ code, label }) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editPhoneNumber}
                    onChange={e => setEditPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234567890"
                    className={`${inputClass} flex-1 min-w-0`}
                    autoFocus
                  />
                </div>
              }
            />

            <FieldRow
              field="birthday"
              label="Birthday"
              display={new Date(user.birthday).toLocaleDateString()}
              editContent={
                <input
                  type="date"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              }
            />

          </div>
        </div>

        {/* Class Credits Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-6">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">My Class Credits</h2>
          <p className="text-white text-lg">
            You have <span className="text-amber-400 font-bold text-3xl">{totalCredits}</span> {totalCredits === 1 ? 'class' : 'classes'} remaining
          </p>
          {totalCredits === 0 && (
            <p className="text-gray-400 text-sm mt-2">Purchase a package to start booking classes!</p>
          )}
          <button
            onClick={() => router.push('/packages')}
            className="mt-4 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg transition"
          >
            Buy More Classes
          </button>
        </div>

        {/* Upcoming Classes Card */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">Upcoming Classes</h2>

          {upcomingBookings.length === 0 ? (
            <p className="text-gray-400 mb-4">No upcoming classes booked yet.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white">{booking.class.title}</h3>
                    <span className="px-3 py-1 bg-amber-400 text-black text-xs font-bold rounded-full">
                      Reformer #{booking.stretcherNumber}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-gray-300">
                      📅 {new Date(booking.class.startTime).toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-300">
                      🕐 {new Date(booking.class.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(booking.class.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {booking.class.instructor && (
                      <p className="text-gray-300">👤 {booking.class.instructor}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCancelBooking(booking)}
                    disabled={cancellingId === booking.id}
                    className="px-4 py-1.5 bg-red-900 hover:bg-red-800 disabled:bg-gray-700 disabled:text-gray-500 text-red-300 text-sm font-medium rounded-lg transition"
                  >
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => totalCredits > 0 ? router.push('/book') : router.push('/packages')}
            disabled={totalCredits === 0}
            className={`px-6 py-3 font-semibold rounded-lg transition ${
              totalCredits === 0
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 text-black'
            }`}
          >
            {totalCredits > 0 ? 'Book a Class' : 'Buy Classes First'}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Booking {
  id: string
  stretcherNumber: number
  class: {
    title: string
    startTime: string
    endTime: string
    instructor: string | null
  }
}

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.heif']

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalCredits, setTotalCredits] = useState(0)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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
      setUploadStatus('success')

      // Update localStorage so the picture persists across navigation
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
        // Fetch credits
        const creditsResponse = await fetch(`/api/user/credits?userId=${parsedUser.id}`)
        const creditsData = await creditsResponse.json()

        if (creditsResponse.ok) {
          setTotalCredits(creditsData.totalCredits || 0)
        }

        // Fetch bookings
        const bookingsResponse = await fetch(`/api/user/bookings?userId=${parsedUser.id}`)
        const bookingsData = await bookingsResponse.json()

        if (bookingsResponse.ok) {
          setUpcomingBookings(bookingsData.bookings || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }

      setLoading(false)
    }

    fetchUserData()
  }, [router])

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

  if (!user) {
    return null
  }

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
            <div className="flex items-start gap-6">
              {/* Avatar preview */}
              <div className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>

              {/* Dropzone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-gray-700 hover:border-amber-400 hover:bg-gray-800'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.heic,.heif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {uploadStatus === 'uploading' ? (
                  <p className="text-amber-400 text-sm">Uploading...</p>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-gray-400 text-sm">
                      Drag & drop or <span className="text-amber-400">browse</span>
                    </p>
                    <p className="text-gray-600 text-xs mt-1">.png, .jpg, .jpeg, .heic, .heif — max 10MB</p>
                  </>
                )}
              </div>
            </div>

            {uploadStatus === 'success' && (
              <p className="mt-2 text-green-400 text-sm">Profile picture updated!</p>
            )}
            {uploadStatus === 'error' && uploadError && (
              <p className="mt-2 text-red-400 text-sm">{uploadError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">First Name</label>
              <p className="text-white text-lg">{user.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Last Name</label>
              <p className="text-white text-lg">{user.lastName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <p className="text-white text-lg">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
              <p className="text-white text-lg">{user.phone}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Birthday</label>
              <p className="text-white text-lg">
                {new Date(user.birthday).toLocaleDateString()}
              </p>
            </div>

            {user.additionalInfo && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">More Info</label>
                <p className="text-white text-lg">{user.additionalInfo}</p>
              </div>
            )}
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
                      Stretcher #{booking.stretcherNumber}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">
                      📅 {new Date(booking.class.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-300">
                      🕐 {new Date(booking.class.startTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(booking.class.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {booking.class.instructor && (
                      <p className="text-gray-300">👤 {booking.class.instructor}</p>
                    )}
                  </div>
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
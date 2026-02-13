'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface Class {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  instructor: string | null
  bookedSpots: number
  availableSpots: number
  isFull: boolean
}

export default function BookClassPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingClass, setBookingClass] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const userData = localStorage.getItem('user')
      
      if (!userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Fetch available classes
      try {
        const response = await fetch('/api/classes/available')
        const data = await response.json()
        
        if (response.ok) {
          setClasses(data.classes)
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleBookClass = async (classId: string) => {
    setBookingClass(classId)

    try {
      const response = await fetch('/api/classes/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          classId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Booking failed', {
          style: {
            background: '#1a1a1a',
            color: '#fbbf24',
            border: '1px solid #ef4444',
          },
        })
        setBookingClass(null)
        return
      }

      toast.success(`Class booked! Your stretcher is #${data.booking.stretcherNumber}`, {
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #22c55e',
        },
      })

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      toast.error('Network error. Please try again.', {
        style: {
          background: '#1a1a1a',
          color: '#fbbf24',
          border: '1px solid #ef4444',
        },
      })
      setBookingClass(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-amber-400 mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-4xl font-bold text-amber-400 mb-2">Book a Class</h1>
        <p className="text-gray-400 mb-8">Select a class to reserve your spot</p>

        {classes.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-gray-400">No upcoming classes available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{cls.title}</h3>
                    {cls.description && (
                      <p className="text-gray-400 text-sm">{cls.description}</p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    cls.isFull 
                      ? 'bg-red-900/20 text-red-400 border border-red-500' 
                      : 'bg-green-900/20 text-green-400 border border-green-500'
                  }`}>
                    {cls.isFull ? 'Full' : `${cls.availableSpots} spots left`}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(cls.startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(cls.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {new Date(cls.endTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  {cls.instructor && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {cls.instructor}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleBookClass(cls.id)}
                  disabled={cls.isFull || bookingClass === cls.id}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    cls.isFull
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : bookingClass === cls.id
                      ? 'bg-amber-600 text-white cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-500 text-black'
                  }`}
                >
                  {bookingClass === cls.id ? 'Booking...' : cls.isFull ? 'Class Full' : 'Book Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
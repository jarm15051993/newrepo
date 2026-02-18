'use client'

import { useState, useEffect, useMemo } from 'react'
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
  isBooked: boolean
  userStretcherNumber: number | null
}

function getAvailabilityColor(cls: Class) {
  if (cls.isBooked) return 'amber'
  if (cls.isFull) return 'red'
  if (cls.availableSpots <= 2) return 'yellow'
  return 'green'
}

const dotColors: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  amber: 'bg-amber-400',
}

// Build a full month grid for display
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = lastDay.getDate()

  const cells: Array<{ day: number; dateKey: string } | null> = []

  // Leading blanks
  for (let i = 0; i < startDow; i++) cells.push(null)

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const dateKey = dt.toLocaleDateString('en-CA') // YYYY-MM-DD
    cells.push({ day: d, dateKey })
  }

  return cells
}

export default function BookClassPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [totalCredits, setTotalCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processingClass, setProcessingClass] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Calendar month navigation
  const today = useMemo(() => new Date(), [])
  const todayKey = today.toLocaleDateString('en-CA')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const fetchClasses = async (userId: string) => {
    try {
      const response = await fetch(`/api/classes/available?userId=${userId}`)
      const data = await response.json()
      if (response.ok) {
        setClasses(data.classes)
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }

  useEffect(() => {
    const init = async () => {
      const userData = localStorage.getItem('user')

      if (!userData) {
        router.push('/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      const [, creditsRes] = await Promise.all([
        fetchClasses(parsedUser.id),
        fetch(`/api/user/credits?userId=${parsedUser.id}`),
      ])
      const creditsData = await creditsRes.json()
      if (creditsRes.ok) setTotalCredits(creditsData.totalCredits ?? 0)
      setLoading(false)
    }
    init()
  }, [router])

  // Group classes by date key
  const groupedByDay = useMemo(() => {
    const groups: Map<string, Class[]> = new Map()
    for (const cls of classes) {
      const dateKey = new Date(cls.startTime).toLocaleDateString('en-CA')
      if (!groups.has(dateKey)) groups.set(dateKey, [])
      groups.get(dateKey)!.push(cls)
    }
    return groups
  }, [classes])

  // Check if today has no remaining classes (all in the past)
  const todayHasNoMoreClasses = useMemo(() => {
    const todayClasses = groupedByDay.get(todayKey)
    if (!todayClasses) return true
    const now = new Date()
    return todayClasses.every(cls => new Date(cls.startTime) < now)
  }, [groupedByDay, todayKey])

  const calendarCells = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const selectedClasses = selectedDay ? (groupedByDay.get(selectedDay) ?? []) : []

  const handleBookClass = async (classId: string) => {
    setProcessingClass(classId)
    try {
      const response = await fetch('/api/classes/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, classId })
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Booking failed', {
          style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #ef4444' },
        })
        return
      }
      toast.success(`Class booked! Your reformer is #${data.booking.stretcherNumber}`, {
        duration: 4000,
        style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #22c55e' },
      })
      setTotalCredits(c => Math.max(0, c - 1))
      await fetchClasses(user.id)
    } catch (error) {
      toast.error('Network error. Please try again.', {
        style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #ef4444' },
      })
    } finally {
      setProcessingClass(null)
    }
  }

  const handleCancelClass = async (classId: string) => {
    setProcessingClass(classId)
    try {
      const response = await fetch('/api/classes/book', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, classId })
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Cancellation failed', {
          style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #ef4444' },
        })
        return
      }
      toast.success('Booking cancelled. Your credit has been reinstated.', {
        duration: 4000,
        style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #22c55e' },
      })
      setTotalCredits(c => c + 1)
      await fetchClasses(user.id)
    } catch (error) {
      toast.error('Network error. Please try again.', {
        style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #ef4444' },
      })
    } finally {
      setProcessingClass(null)
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
    <div className="min-h-screen bg-black p-4 sm:p-8">
      <Toaster position="top-center" />

      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-amber-400 mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-4xl font-bold text-amber-400 mb-2">Book a Class</h1>
        <p className="text-gray-400 mb-6">Select a day to see available classes</p>

        {/* Calendar */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 mb-8">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPrevMonth} className="text-gray-400 hover:text-amber-400 p-2 rounded-lg hover:bg-gray-800 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-white">{monthLabel}</h2>
            <button onClick={goToNextMonth} className="text-gray-400 hover:text-amber-400 p-2 rounded-lg hover:bg-gray-800 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={`blank-${i}`} />

              const hasClasses = groupedByDay.has(cell.dateKey)
              const isSelected = selectedDay === cell.dateKey
              const isToday = cell.dateKey === todayKey

              return (
                <button
                  key={cell.dateKey}
                  onClick={() => hasClasses && setSelectedDay(cell.dateKey)}
                  disabled={!hasClasses}
                  className={`relative flex items-center justify-center py-2 sm:py-3 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-amber-400/15 border border-amber-500 text-amber-400'
                      : isToday
                      ? 'text-amber-400 border border-amber-500/40 hover:bg-gray-800 cursor-pointer'
                      : hasClasses
                      ? 'text-white hover:bg-gray-800 border border-transparent cursor-pointer'
                      : 'text-gray-600 border border-transparent cursor-default'
                  }`}
                >
                  <span className="text-sm font-medium">
                    {cell.day}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Classes section */}
        {!selectedDay ? (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            {todayHasNoMoreClasses ? (
              <p className="text-gray-400">No more classes available for today. Select a day to see upcoming classes.</p>
            ) : (
              <p className="text-gray-400">Select a day to see available classes.</p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h2>

            {selectedClasses.length === 0 ? (
              <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
                <p className="text-gray-400">No classes available on this day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedClasses.map(cls => {
                  const isProcessing = processingClass === cls.id
                  const color = getAvailabilityColor(cls)

                  const badgeStyles: Record<string, string> = {
                    amber: 'bg-amber-900/20 text-amber-400 border border-amber-500',
                    red: 'bg-red-900/20 text-red-400 border border-red-500',
                    yellow: 'bg-yellow-900/20 text-yellow-400 border border-yellow-500',
                    green: 'bg-green-900/20 text-green-400 border border-green-500',
                  }

                  const badgeText = cls.isBooked
                    ? `Reformer #${cls.userStretcherNumber}`
                    : cls.isFull
                    ? 'Full'
                    : `${cls.availableSpots} spots left`

                  return (
                    <div
                      key={cls.id}
                      className={`bg-gray-900 rounded-2xl p-6 border ${cls.isBooked ? 'border-amber-500/50' : 'border-gray-800'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{cls.title}</h3>
                          {cls.description && (
                            <p className="text-gray-400 text-sm">{cls.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${dotColors[color]}`} />
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStyles[color]}`}>
                            {badgeText}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
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

                      {cls.isBooked ? (
                        <button
                          onClick={() => handleCancelClass(cls.id)}
                          disabled={isProcessing}
                          className={`w-full py-3 rounded-lg font-semibold transition ${
                            isProcessing
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                        >
                          {isProcessing ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      ) : (
                        <button
                          onClick={() => totalCredits === 0 ? router.push('/packages') : handleBookClass(cls.id)}
                          disabled={cls.isFull || isProcessing}
                          className={`w-full py-3 rounded-lg font-semibold transition ${
                            cls.isFull
                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                              : isProcessing
                              ? 'bg-amber-600 text-white cursor-not-allowed'
                              : 'bg-amber-400 hover:bg-amber-500 text-black'
                          }`}
                        >
                          {isProcessing ? 'Booking...' : cls.isFull ? 'Class Full' : totalCredits === 0 ? 'Buy More Classes' : 'Book Now'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

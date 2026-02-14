'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

interface BookedUser {
  id: string
  stretcherNumber: number
  user: {
    id: string
    name: string
    lastName: string
    email: string
    phone: string
  }
}

interface AdminClass {
  id: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  capacity: number
  bookedCount: number
  instructor: string | null
  bookings: BookedUser[]
}

const defaultForm = {
  title: '',
  description: '',
  date: '',
  startHour: '09',
  startMinute: '00',
  endHour: '10',
  endMinute: '00',
  capacity: '6',
  instructor: ''
}

export default function AdminPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes')
      const data = await res.json()
      if (res.ok) setClasses(data.classes)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchClasses().finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) {
      toast.error('Please select a date')
      return
    }

    setSubmitting(true)
    try {
      const startTime = `${form.date}T${form.startHour}:${form.startMinute}:00`
      const endTime = `${form.date}T${form.endHour}:${form.endMinute}:00`

      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          startTime,
          endTime,
          capacity: form.capacity,
          instructor: form.instructor || null
        })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to create class', {
          style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #ef4444' }
        })
        return
      }

      toast.success('Class created successfully!', {
        duration: 3000,
        style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #22c55e' }
      })
      setForm(defaultForm)
      await fetchClasses()
    } catch (err) {
      toast.error('Network error. Please try again.', {
        style: { background: '#1a1a1a', color: '#fbbf24', border: '1px solid #ef4444' }
      })
    } finally {
      setSubmitting(false)
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

  return (
    <div className="min-h-screen bg-black p-8">
      <Toaster position="top-center" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-amber-400">Admin Panel</h1>
            <p className="text-gray-400 mt-1">Manage classes and view bookings</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition text-sm"
          >
            ← Dashboard
          </button>
        </div>

        {/* Create Class Form */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-10">
          <h2 className="text-2xl font-bold text-amber-400 mb-6">Create New Class</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Class Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Morning Flow"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Optional class description"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 [color-scheme:dark]"
                />
              </div>

              {/* Instructor */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Instructor</label>
                <input
                  type="text"
                  name="instructor"
                  value={form.instructor}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Martinez"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Start Time <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="startHour"
                    value={form.startHour}
                    onChange={handleChange}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-amber-400"
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-white self-center font-bold">:</span>
                  <select
                    name="startMinute"
                    value={form.startMinute}
                    onChange={handleChange}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-amber-400"
                  >
                    {minutes.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  End Time <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    name="endHour"
                    value={form.endHour}
                    onChange={handleChange}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-amber-400"
                  >
                    {hours.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-white self-center font-bold">:</span>
                  <select
                    name="endMinute"
                    value={form.endMinute}
                    onChange={handleChange}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white focus:outline-none focus:border-amber-400"
                  >
                    {minutes.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Capacity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={form.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  max="20"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 rounded-lg font-semibold transition ${
                submitting
                  ? 'bg-amber-600 text-white cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-500 text-black'
              }`}
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </form>
        </div>

        {/* Class Roster */}
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-2xl font-bold text-amber-400 mb-6">Upcoming Classes</h2>

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : classes.length === 0 ? (
            <p className="text-gray-400">No upcoming classes. Create one above.</p>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => {
                const isExpanded = expandedClass === cls.id
                const spotsLeft = cls.capacity - cls.bookedCount

                return (
                  <div
                    key={cls.id}
                    className="border border-gray-700 rounded-xl overflow-hidden"
                  >
                    {/* Class Header Row */}
                    <button
                      onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                      className="w-full flex items-center justify-between p-5 bg-gray-800 hover:bg-gray-750 text-left transition"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{cls.title}</p>
                          <p className="text-gray-400 text-sm">
                            {new Date(cls.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {' · '}
                            {new Date(cls.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {' – '}
                            {new Date(cls.endTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {cls.instructor && ` · ${cls.instructor}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4 shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          cls.bookedCount >= cls.capacity
                            ? 'bg-red-900/20 text-red-400 border border-red-500'
                            : 'bg-green-900/20 text-green-400 border border-green-500'
                        }`}>
                          {cls.bookedCount}/{cls.capacity} booked
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded User Roster */}
                    {isExpanded && (
                      <div className="p-5 border-t border-gray-700">
                        {cls.bookings.length === 0 ? (
                          <p className="text-gray-500 text-sm">No users booked yet.</p>
                        ) : (
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">
                              Booked users — {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {cls.bookings.map((booking) => (
                                <div
                                  key={booking.id}
                                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-3"
                                >
                                  <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-black font-bold text-sm shrink-0">
                                    #{booking.stretcherNumber}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-white font-medium text-sm truncate">
                                      {booking.user.name} {booking.user.lastName}
                                    </p>
                                    <p className="text-gray-400 text-xs truncate">{booking.user.email}</p>
                                    <p className="text-gray-500 text-xs">{booking.user.phone}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty reformer slots */}
                        {spotsLeft > 0 && (
                          <div className="mt-4">
                            <p className="text-gray-600 text-xs uppercase tracking-wider mb-2">Available reformers</p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: cls.capacity }, (_, i) => i + 1)
                                .filter(n => !cls.bookings.some(b => b.stretcherNumber === n))
                                .map(n => (
                                  <span
                                    key={n}
                                    className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-600 text-sm"
                                  >
                                    #{n}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

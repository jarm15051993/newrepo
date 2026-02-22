'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface Customer {
  id: string
  name: string | null
  lastName: string | null
  email: string
  phone: string | null
  availableClasses: number
  allTimePurchases: number
  totalValue: number
  lastPurchase: string | null
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

const toastOpts = (border: string) => ({
  style: { background: '#FAFAF7', color: '#1A1512', border: `1px solid ${border}` }
})

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'classes' | 'customers'>('classes')

  // ── Classes state ────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  // ── Customers state ──────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // ── Fetch classes ─────────────────────────────────────────────────────────────
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
    fetchClasses().finally(() => setClassesLoading(false))
  }, [])

  // ── Fetch customers ───────────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async (q: string) => {
    setCustomersLoading(true)
    try {
      const res = await fetch(`/api/admin/customers?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok) setCustomers(data.customers)
    } catch (err) {
      console.error(err)
    } finally {
      setCustomersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'customers') fetchCustomers(debouncedSearch)
  }, [tab, debouncedSearch, fetchCustomers])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  // ── Class form ────────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) { toast.error('Please select a date'); return }
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
          startTime, endTime,
          capacity: form.capacity,
          instructor: form.instructor || null
        })
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create class', toastOpts('#ef4444')); return }
      toast.success('Class created successfully!', { duration: 3000, ...toastOpts('#22c55e') })
      setForm(defaultForm)
      await fetchClasses()
    } catch {
      toast.error('Network error. Please try again.', toastOpts('#ef4444'))
    } finally {
      setSubmitting(false)
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = ['00', '15', '30', '45']

  const inputClass = 'w-full bg-warm-white border border-rule rounded-lg px-4 py-3 text-ink placeholder-lgray focus:outline-none focus:border-burg'
  const selectClass = 'flex-1 bg-warm-white border border-rule rounded-lg px-3 py-3 text-ink focus:outline-none focus:border-burg'

  return (
    <div className="min-h-screen bg-cream p-8">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif font-light text-burg tracking-wide">Admin <em>Panel</em></h1>
            <p className="text-mgray mt-1 text-sm tracking-wider uppercase">OOMA Wellness Club</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-bone hover:bg-bone-dk text-ink rounded-lg transition text-sm tracking-wide"
          >
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-warm-white p-1 rounded-xl border border-rule mb-8 w-fit">
          {(['classes', 'customers'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition capitalize tracking-wider ${
                tab === t
                  ? 'bg-ink text-warm-white'
                  : 'text-mgray hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Classes Tab ─────────────────────────────────────────────────────── */}
        {tab === 'classes' && (
          <>
            {/* Create Class Form */}
            <div className="bg-warm-white rounded-2xl p-8 border border-rule mb-10">
              <h2 className="text-2xl font-serif font-light text-burg mb-6 tracking-wide">Create New Class</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Class Title <span className="text-burg">*</span></label>
                    <input type="text" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Morning Flow"
                      className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Description</label>
                    <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Optional class description"
                      className="w-full bg-warm-white border border-rule rounded-lg px-4 py-3 text-ink placeholder-lgray focus:outline-none focus:border-burg resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Date <span className="text-burg">*</span></label>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-warm-white border border-rule rounded-lg px-4 py-3 text-ink focus:outline-none focus:border-burg [color-scheme:light]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Instructor</label>
                    <input type="text" name="instructor" value={form.instructor} onChange={handleChange} placeholder="e.g. Sarah Martinez"
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Start Time <span className="text-burg">*</span></label>
                    <div className="flex gap-2">
                      <select name="startHour" value={form.startHour} onChange={handleChange} className={selectClass}>
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-ink self-center font-medium">:</span>
                      <select name="startMinute" value={form.startMinute} onChange={handleChange} className={selectClass}>
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">End Time <span className="text-burg">*</span></label>
                    <div className="flex gap-2">
                      <select name="endHour" value={form.endHour} onChange={handleChange} className={selectClass}>
                        {hours.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      <span className="text-ink self-center font-medium">:</span>
                      <select name="endMinute" value={form.endMinute} onChange={handleChange} className={selectClass}>
                        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Capacity <span className="text-burg">*</span></label>
                    <input type="number" name="capacity" value={form.capacity} onChange={handleChange} required min="1" max="20"
                      className={inputClass} />
                  </div>
                </div>
                <button type="submit" disabled={submitting}
                  className={`w-full py-3 rounded-lg font-medium transition tracking-wider text-sm uppercase ${submitting ? 'bg-bone text-lgray cursor-not-allowed' : 'bg-ink hover:bg-burg text-warm-white'}`}>
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </form>
            </div>

            {/* Class Roster */}
            <div className="bg-warm-white rounded-2xl p-8 border border-rule">
              <h2 className="text-2xl font-serif font-light text-burg mb-6 tracking-wide">Upcoming Classes</h2>
              {classesLoading ? (
                <p className="text-mgray text-sm">Loading...</p>
              ) : classes.length === 0 ? (
                <p className="text-mgray text-sm">No upcoming classes. Create one above.</p>
              ) : (
                <div className="space-y-4">
                  {classes.map((cls) => {
                    const isExpanded = expandedClass === cls.id
                    const spotsLeft = cls.capacity - cls.bookedCount
                    return (
                      <div key={cls.id} className="border border-rule rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                          className="w-full flex items-center justify-between p-5 bg-bone hover:bg-bone-dk text-left transition"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="min-w-0">
                              <p className="text-ink font-medium truncate tracking-wide">{cls.title}</p>
                              <p className="text-mgray text-sm">
                                {new Date(cls.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {' · '}
                                {new Date(cls.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {' – '}
                                {new Date(cls.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                {cls.instructor && ` · ${cls.instructor}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4 shrink-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls.bookedCount >= cls.capacity ? 'bg-red-50 text-red-600 border border-red-300' : 'bg-green-50 text-green-700 border border-green-300'}`}>
                              {cls.bookedCount}/{cls.capacity} booked
                            </span>
                            <svg className={`w-5 h-5 text-mgray transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="p-5 border-t border-rule bg-warm-white">
                            {cls.bookings.length === 0 ? (
                              <p className="text-lgray text-sm">No users booked yet.</p>
                            ) : (
                              <div>
                                <p className="text-mgray text-xs uppercase tracking-wider mb-3">
                                  Booked users — {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} remaining
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {cls.bookings.map((booking) => (
                                    <div key={booking.id} className="flex items-center gap-3 bg-bone rounded-lg p-3">
                                      <div className="w-9 h-9 rounded-full bg-burg flex items-center justify-center text-warm-white font-medium text-sm shrink-0">
                                        #{booking.stretcherNumber}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-ink font-medium text-sm truncate">{booking.user.name} {booking.user.lastName}</p>
                                        <p className="text-mgray text-xs truncate">{booking.user.email}</p>
                                        <p className="text-lgray text-xs">{booking.user.phone}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {spotsLeft > 0 && (
                              <div className="mt-4">
                                <p className="text-lgray text-xs uppercase tracking-wider mb-2">Available reformers</p>
                                <div className="flex flex-wrap gap-2">
                                  {Array.from({ length: cls.capacity }, (_, i) => i + 1)
                                    .filter(n => !cls.bookings.some(b => b.stretcherNumber === n))
                                    .map(n => (
                                      <span key={n} className="w-9 h-9 rounded-full border border-rule flex items-center justify-center text-lgray text-sm">
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
          </>
        )}

        {/* ── Customers Tab ────────────────────────────────────────────────────── */}
        {tab === 'customers' && (
          <div className="bg-warm-white rounded-2xl p-8 border border-rule">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-serif font-light text-burg tracking-wide">Customers</h2>
              <div className="relative w-full sm:w-80">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-warm-white border border-rule rounded-lg text-ink placeholder-lgray focus:outline-none focus:border-burg text-sm"
                />
              </div>
            </div>

            {customersLoading ? (
              <p className="text-mgray text-sm">Loading...</p>
            ) : customers.length === 0 ? (
              <p className="text-lgray text-sm">{search ? 'No customers match your search.' : 'No customers found.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rule">
                      {['Name', 'Last Name', 'Phone', 'Email', 'Available Classes', 'All-Time Purchases', 'Total Value', 'Last Purchase'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-mgray uppercase tracking-wider pb-3 pr-4 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-bone/50 transition">
                        <td className="py-3 pr-4 text-ink font-medium">{c.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-ink">{c.lastName ?? '—'}</td>
                        <td className="py-3 pr-4 text-mgray whitespace-nowrap">{c.phone ?? '—'}</td>
                        <td className="py-3 pr-4 text-mgray">{c.email}</td>
                        <td className="py-3 pr-4">
                          <span className={`font-medium ${c.availableClasses > 0 ? 'text-burg' : 'text-lgray'}`}>
                            {c.availableClasses}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-mgray">{c.allTimePurchases}</td>
                        <td className="py-3 pr-4 text-mgray">
                          {c.totalValue > 0 ? `€${c.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                        </td>
                        <td className="py-3 pr-4 text-lgray whitespace-nowrap">
                          {c.lastPurchase
                            ? new Date(c.lastPurchase).toLocaleString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-lgray text-xs mt-4">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
    additionalInfo: string | null
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

interface InactiveCustomer {
  id: string
  name: string | null
  lastName: string | null
  email: string
  phone: string | null
  createdAt: string
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
  instructor: '',
  classType: 'REFORMER',
}

const toastOpts = (border: string) => ({
  style: { background: '#FAFAF7', color: '#1A1512', border: `1px solid ${border}` }
})

// ── CSV utilities ─────────────────────────────────────────────────────────────
function downloadCSV(rows: (string | number | null)[][], filename: string) {
  const csv = rows
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  if (lines.length < 2) return []
  const parseRow = (line: string): string[] => {
    const result: string[] = []; let current = ''; let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
      else current += ch
    }
    result.push(current.trim()); return result
  }
  const headers = parseRow(lines[0]).map(h =>
    h.toLowerCase().replace(/[\s\-_]/g, '').replace('firstname', 'name').replace('lastname', 'lastname')
  )
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseRow(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const cells: Array<{ day: number; dateKey: string } | null> = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    cells.push({ day: d, dateKey: dt.toLocaleDateString('en-CA') })
  }
  return cells
}

const AVATAR_COLORS = ['#9B8A8A', '#6E9E97', '#897899', '#8A9E7A', '#9A7A8E', '#7A8E9E']
function avatarColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function parseConditions(info: string | null): { tags: string[]; other: string | null } {
  if (!info) return { tags: [], other: null }
  const otherIdx = info.indexOf(', Other: ')
  if (otherIdx !== -1) {
    return { tags: info.slice(0, otherIdx).split(', ').filter(Boolean), other: info.slice(otherIdx + 9) }
  }
  if (info.startsWith('Other: ')) return { tags: [], other: info.slice(7) }
  return { tags: info.split(', ').filter(Boolean), other: null }
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'classes' | 'customers' | 'inactive'>('classes')

  // ── Classes state ────────────────────────────────────────────────────────────
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const [calSelectedDay, setCalSelectedDay] = useState<string | null>(null)
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())

  // ── Customers state ──────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // ── Inactive customers state ──────────────────────────────────────────────────
  const [inactiveCustomers, setInactiveCustomers] = useState<InactiveCustomer[]>([])
  const [inactiveLoading, setInactiveLoading] = useState(false)
  const [inactiveSearch, setInactiveSearch] = useState('')
  const [debouncedInactiveSearch, setDebouncedInactiveSearch] = useState('')

  // ── CSV import state & refs ───────────────────────────────────────────────────
  const [importingActive, setImportingActive] = useState(false)
  const [importingInactive, setImportingInactive] = useState(false)
  const activeImportRef = useRef<HTMLInputElement>(null)
  const inactiveImportRef = useRef<HTMLInputElement>(null)

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

  // ── Fetch inactive customers ───────────────────────────────────────────────────
  const fetchInactiveCustomers = useCallback(async (q: string) => {
    setInactiveLoading(true)
    try {
      const res = await fetch(`/api/admin/inactive-customers?search=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok) setInactiveCustomers(data.customers)
    } catch (err) {
      console.error(err)
    } finally {
      setInactiveLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'inactive') fetchInactiveCustomers(debouncedInactiveSearch)
  }, [tab, debouncedInactiveSearch, fetchInactiveCustomers])

  // Debounce search inputs
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedInactiveSearch(inactiveSearch), 350)
    return () => clearTimeout(timer)
  }, [inactiveSearch])

  // ── Calendar computed ─────────────────────────────────────────────────────────
  const todayKey = useMemo(() => new Date().toLocaleDateString('en-CA'), [])

  const classByDay = useMemo(() => {
    const m = new Map<string, AdminClass[]>()
    for (const cls of classes) {
      const k = new Date(cls.startTime).toLocaleDateString('en-CA')
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(cls)
    }
    return m
  }, [classes])

  const calCells = useMemo(() => buildCalendarGrid(calYear, calMonth), [calYear, calMonth])
  const calMonthLabel = new Date(calYear, calMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const goToPrevCalMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const goToNextCalMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const dayClasses = calSelectedDay ? (classByDay.get(calSelectedDay) ?? []) : []

  useEffect(() => {
    setExpandedClasses(new Set())
  }, [calSelectedDay])

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.replace('/admin/login')
  }

  // ── CSV export ────────────────────────────────────────────────────────────────
  const handleExportActive = () => {
    const headers = ['Name', 'Last Name', 'Phone', 'Email', 'Available Classes', 'All-Time Purchases', 'Total Value', 'Last Purchase']
    const rows = customers.map(c => [
      c.name, c.lastName, c.phone, c.email,
      c.availableClasses, c.allTimePurchases,
      c.totalValue > 0 ? c.totalValue.toFixed(2) : 0,
      c.lastPurchase ? new Date(c.lastPurchase).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
    ])
    downloadCSV([headers, ...rows], `active-customers-${new Date().toISOString().split('T')[0]}.csv`)
  }

  const handleExportInactive = () => {
    const headers = ['Name', 'Last Name', 'Phone', 'Email', 'Signed Up At']
    const rows = inactiveCustomers.map(c => [
      c.name, c.lastName, c.phone, c.email,
      new Date(c.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    ])
    downloadCSV([headers, ...rows], `non-active-customers-${new Date().toISOString().split('T')[0]}.csv`)
  }

  // ── CSV import ────────────────────────────────────────────────────────────────
  const handleActiveImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportingActive(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const customers = rows.map(r => ({
        email: r.email || r['e-mail'] || '',
        name: r.name || r.firstname || '',
        lastName: r.lastname || r.surname || '',
        phone: r.phone || r.phonenumber || '',
      })).filter(r => r.email)
      if (!customers.length) { toast.error('No valid rows found in CSV', toastOpts('#ef4444')); return }
      const res = await fetch('/api/admin/customers/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Import failed', toastOpts('#ef4444')); return }
      toast.success(`Imported: ${data.created} created, ${data.skipped} skipped`, { duration: 4000, ...toastOpts('#22c55e') })
      fetchCustomers(debouncedSearch)
    } catch { toast.error('Failed to read file', toastOpts('#ef4444')) }
    finally { setImportingActive(false) }
  }

  const handleInactiveImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImportingInactive(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      const customers = rows.map(r => ({
        email: r.email || r['e-mail'] || '',
        name: r.name || r.firstname || '',
        lastName: r.lastname || r.surname || '',
        phone: r.phone || r.phonenumber || '',
      })).filter(r => r.email)
      if (!customers.length) { toast.error('No valid rows found in CSV', toastOpts('#ef4444')); return }
      const res = await fetch('/api/admin/inactive-customers/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Import failed', toastOpts('#ef4444')); return }
      toast.success(`Imported: ${data.created} created, ${data.skipped} skipped`, { duration: 4000, ...toastOpts('#22c55e') })
      fetchInactiveCustomers(debouncedInactiveSearch)
    } catch { toast.error('Failed to read file', toastOpts('#ef4444')) }
    finally { setImportingInactive(false) }
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
          instructor: form.instructor || null,
          classType: form.classType,
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
          {([['classes', 'Classes'], ['customers', 'Active Customers'], ['inactive', 'Non-Active']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition tracking-wider ${
                tab === t
                  ? 'bg-ink text-warm-white'
                  : 'text-mgray hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Classes Tab ─────────────────────────────────────────────────────── */}
        {tab === 'classes' && (
          <>
            {/* Class Schedule */}
            <div className="bg-warm-white rounded-2xl p-6 sm:p-8 border border-rule mb-10">
              <h2 className="text-2xl font-serif font-light text-burg mb-6 tracking-wide">Class Schedule</h2>

              {/* Calendar */}
              <div className="border border-rule rounded-xl p-4 sm:p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={goToPrevCalMonth} className="text-mgray hover:text-burg p-2 rounded-lg hover:bg-bone transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="text-base font-serif font-light text-ink tracking-wide">{calMonthLabel}</h3>
                  <button onClick={goToNextCalMonth} className="text-mgray hover:text-burg p-2 rounded-lg hover:bg-bone transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-xs font-medium text-lgray py-1 tracking-wider">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calCells.map((cell, i) => {
                    if (!cell) return <div key={`blank-${i}`} />
                    const hasClasses = classByDay.has(cell.dateKey)
                    const isSelected = calSelectedDay === cell.dateKey
                    const isToday = cell.dateKey === todayKey
                    return (
                      <button
                        key={cell.dateKey}
                        onClick={() => hasClasses && setCalSelectedDay(cell.dateKey)}
                        disabled={!hasClasses}
                        className={`relative flex flex-col items-center justify-center py-2 sm:py-3 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-burg-pale/30 border border-burg text-burg'
                            : isToday
                            ? 'text-burg border border-burg/40 hover:bg-bone cursor-pointer'
                            : hasClasses
                            ? 'text-ink hover:bg-bone border border-transparent cursor-pointer'
                            : 'text-lgray border border-transparent cursor-default'
                        }`}
                      >
                        <span className="text-sm font-medium">{cell.day}</span>
                        {hasClasses && <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-burg opacity-60" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Day roster */}
              {classesLoading ? (
                <p className="text-mgray text-sm">Loading...</p>
              ) : !calSelectedDay ? (
                <p className="text-mgray text-sm text-center py-4">Select a day on the calendar to view class rosters.</p>
              ) : dayClasses.length === 0 ? (
                <p className="text-lgray text-sm">No classes scheduled for this day.</p>
              ) : (
                <div className="space-y-5">
                  <h3 className="text-base font-serif font-light text-ink tracking-wide">
                    {new Date(calSelectedDay + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </h3>
                  {dayClasses.map(cls => (
                    <div key={cls.id} className="rounded-2xl border border-rule">
                      <button
                        onClick={() => setExpandedClasses(prev => {
                          const next = new Set(prev)
                          if (next.has(cls.id)) next.delete(cls.id); else next.add(cls.id)
                          return next
                        })}
                        className={`w-full px-5 pt-5 pb-4 bg-bone text-left transition hover:bg-bone-dk ${expandedClasses.has(cls.id) ? 'rounded-t-2xl' : 'rounded-2xl'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-ink tracking-wide">
                              {cls.title}{cls.description ? ` · ${cls.description}` : ''}
                            </h4>
                            <p className="text-mgray text-sm mt-1">
                              {new Date(cls.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              {' — '}
                              {new Date(cls.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              {' · '}
                              {cls.bookedCount} {cls.bookedCount === 1 ? 'alumna' : 'alumnas'}
                              {cls.instructor && ` · ${cls.instructor}`}
                            </p>
                          </div>
                          <svg className={`w-5 h-5 text-mgray mt-1 shrink-0 transition-transform ${expandedClasses.has(cls.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {expandedClasses.has(cls.id) && (
                      <div className="p-3 space-y-2 rounded-b-2xl">
                        {Array.from({ length: cls.capacity }, (_, i) => i + 1).map(spot => {
                          const booking = cls.bookings.find(b => b.stretcherNumber === spot)
                          if (!booking) {
                            return (
                              <div key={spot} className="flex items-center gap-3 bg-bone/50 rounded-xl px-4 py-3 border border-rule/60">
                                <div className="w-9 h-9 rounded-full border-2 border-dashed border-rule flex items-center justify-center text-lgray text-xs font-medium shrink-0">
                                  #{spot}
                                </div>
                                <span className="text-lgray text-sm">Available</span>
                              </div>
                            )
                          }
                          const u = booking.user
                          const hasConditions = !!u.additionalInfo
                          const { tags, other } = parseConditions(u.additionalInfo)
                          const initials = `${u.name?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase() || '?'
                          const bgColor = avatarColor((u.name ?? '') + (u.lastName ?? ''))
                          return (
                            <div key={booking.id} className="flex items-center justify-between bg-warm-white rounded-xl px-4 py-3 border border-rule">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                                  style={{ backgroundColor: bgColor }}
                                >
                                  {initials}
                                </div>
                                <span className="text-ink font-medium text-sm truncate">
                                  {u.name ?? ''} {u.lastName ?? ''}
                                </span>
                              </div>
                              <div className="relative group shrink-0 ml-3">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-default ${
                                  hasConditions
                                    ? 'bg-burg-pale/20 text-burg border-burg/30'
                                    : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${hasConditions ? 'bg-burg' : 'bg-green-500'}`} />
                                  {hasConditions ? 'SÍ' : 'NO'}
                                </span>
                                {hasConditions && (
                                  <div className="absolute right-0 bottom-full mb-2 z-50 w-64 bg-burg text-warm-white rounded-xl p-4 shadow-xl pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                                    <p className="font-serif italic text-warm-white text-sm mb-3">{u.name} {u.lastName}</p>
                                    <p className="text-xs font-medium text-warm-white/60 uppercase tracking-widest mb-2">Conditions</p>
                                    {tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mb-2">
                                        {tags.map(tag => (
                                          <span key={tag} className="px-2.5 py-0.5 rounded-full border border-warm-white/40 text-warm-white text-xs">{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                    {other && (
                                      <p className="text-warm-white/80 text-xs italic mt-1">&ldquo;{other}&rdquo;</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

                        {/* Create Class Form */}
            <div className="bg-warm-white rounded-2xl p-8 border border-rule">
              <h2 className="text-2xl font-serif font-light text-burg mb-6 tracking-wide">Create New Class</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-mgray mb-1 tracking-wide">Class Title <span className="text-burg">*</span></label>
                    <input type="text" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Morning Flow"
                      className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-mgray mb-2 tracking-wide">Class Type <span className="text-burg">*</span></label>
                    <div className="flex gap-3">
                      {(['REFORMER', 'YOGA'] as const).map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="classType"
                            value={type}
                            checked={form.classType === type}
                            onChange={handleChange}
                            className="accent-burg"
                          />
                          <span className="text-sm text-ink">{type === 'REFORMER' ? 'Reformer Pilates' : 'Yoga'}</span>
                        </label>
                      ))}
                    </div>
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
          </>
        )}

        {/* ── Customers Tab ────────────────────────────────────────────────────── */}
        {tab === 'customers' && (
          <div className="bg-warm-white rounded-2xl p-8 border border-rule">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-serif font-light text-burg tracking-wide">Active Customers</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-warm-white border border-rule rounded-lg text-ink placeholder-lgray focus:outline-none focus:border-burg text-sm"
                  />
                </div>
                <button
                  onClick={handleExportActive}
                  disabled={customers.length === 0}
                  className="px-4 py-2 border border-rule text-mgray hover:border-burg hover:text-burg rounded-lg text-sm transition tracking-wide disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => activeImportRef.current?.click()}
                  disabled={importingActive}
                  className="px-4 py-2 bg-ink hover:bg-burg text-warm-white rounded-lg text-sm transition tracking-wide disabled:opacity-50 whitespace-nowrap"
                >
                  {importingActive ? 'Importing…' : 'Import CSV'}
                </button>
                <input ref={activeImportRef} type="file" accept=".csv" className="hidden" onChange={handleActiveImportFile} />
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

        {/* ── Non-Active Customers Tab ─────────────────────────────────────────── */}
        {tab === 'inactive' && (
          <div className="bg-warm-white rounded-2xl p-8 border border-rule">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-serif font-light text-burg tracking-wide">Non-Active Customers</h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone…"
                    value={inactiveSearch}
                    onChange={e => setInactiveSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-warm-white border border-rule rounded-lg text-ink placeholder-lgray focus:outline-none focus:border-burg text-sm"
                  />
                </div>
                <button
                  onClick={handleExportInactive}
                  disabled={inactiveCustomers.length === 0}
                  className="px-4 py-2 border border-rule text-mgray hover:border-burg hover:text-burg rounded-lg text-sm transition tracking-wide disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => inactiveImportRef.current?.click()}
                  disabled={importingInactive}
                  className="px-4 py-2 bg-ink hover:bg-burg text-warm-white rounded-lg text-sm transition tracking-wide disabled:opacity-50 whitespace-nowrap"
                >
                  {importingInactive ? 'Importing…' : 'Import CSV'}
                </button>
                <input ref={inactiveImportRef} type="file" accept=".csv" className="hidden" onChange={handleInactiveImportFile} />
              </div>
            </div>

            {inactiveLoading ? (
              <p className="text-mgray text-sm">Loading...</p>
            ) : inactiveCustomers.length === 0 ? (
              <p className="text-lgray text-sm">{inactiveSearch ? 'No customers match your search.' : 'No non-active customers found.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-rule">
                      {['Name', 'Last Name', 'Phone', 'Email', 'Signed Up At'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-mgray uppercase tracking-wider pb-3 pr-4 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {inactiveCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-bone/50 transition">
                        <td className="py-3 pr-4 text-ink font-medium">{c.name ?? '—'}</td>
                        <td className="py-3 pr-4 text-ink">{c.lastName ?? '—'}</td>
                        <td className="py-3 pr-4 text-mgray whitespace-nowrap">{c.phone ?? '—'}</td>
                        <td className="py-3 pr-4 text-mgray">{c.email}</td>
                        <td className="py-3 pr-4 text-lgray whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-lgray text-xs mt-4">{inactiveCustomers.length} customer{inactiveCustomers.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'

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

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.heif']

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MIN_YEAR = 1940
const MAX_YEAR = new Date().getFullYear()

function daysInMonth(month: number, year: number) {
  if (!month || !year) return 31
  return new Date(year, month, 0).getDate()
}

function BirthdayPicker({ value, onChange, inputClass }: { value: string; onChange: (v: string) => void; inputClass: string }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [year, setYear] = useState(parts[0] || '')
  const [month, setMonth] = useState(parts[1] ? String(parseInt(parts[1])) : '')
  const [day, setDay] = useState(parts[2] ? String(parseInt(parts[2])) : '')

  const maxDay = daysInMonth(parseInt(month), parseInt(year))

  const update = (y: string, m: string, d: string) => {
    setYear(y); setMonth(m); setDay(d)
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    }
  }

  const selectClass = `${inputClass} appearance-none`

  return (
    <div className="flex gap-2">
      <select value={month} onChange={e => update(year, e.target.value, day)} className={selectClass}>
        <option value="">Month</option>
        {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
      </select>
      <select value={day} onChange={e => update(year, month, e.target.value)} className={selectClass}>
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}
      </select>
      <select value={year} onChange={e => update(e.target.value, month, day)} className={selectClass}>
        <option value="">Year</option>
        {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i).map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

const COUNTRY_CODES = [
  { code: '+1',   label: '+1 (US/Canada)',   flag: '🇺🇸' },
  { code: '+52',  label: '+52 (Mexico)',      flag: '🇲🇽' },
  { code: '+54',  label: '+54 (Argentina)',   flag: '🇦🇷' },
  { code: '+55',  label: '+55 (Brazil)',      flag: '🇧🇷' },
  { code: '+56',  label: '+56 (Chile)',       flag: '🇨🇱' },
  { code: '+57',  label: '+57 (Colombia)',    flag: '🇨🇴' },
  { code: '+51',  label: '+51 (Peru)',        flag: '🇵🇪' },
  { code: '+58',  label: '+58 (Venezuela)',   flag: '🇻🇪' },
  { code: '+593', label: '+593 (Ecuador)',    flag: '🇪🇨' },
  { code: '+595', label: '+595 (Paraguay)',   flag: '🇵🇾' },
  { code: '+598', label: '+598 (Uruguay)',    flag: '🇺🇾' },
  { code: '+507', label: '+507 (Panama)',     flag: '🇵🇦' },
  { code: '+506', label: '+506 (Costa Rica)', flag: '🇨🇷' },
  { code: '+503', label: '+503 (El Salvador)', flag: '🇸🇻' },
  { code: '+502', label: '+502 (Guatemala)',  flag: '🇬🇹' },
  { code: '+504', label: '+504 (Honduras)',   flag: '🇭🇳' },
  { code: '+505', label: '+505 (Nicaragua)',  flag: '🇳🇮' },
  { code: '+53',  label: '+53 (Cuba)',        flag: '🇨🇺' },
  { code: '+44',  label: '+44 (UK)',          flag: '🇬🇧' },
  { code: '+34',  label: '+34 (Spain)',       flag: '🇪🇸' },
  { code: '+33',  label: '+33 (France)',      flag: '🇫🇷' },
  { code: '+49',  label: '+49 (Germany)',     flag: '🇩🇪' },
  { code: '+39',  label: '+39 (Italy)',       flag: '🇮🇹' },
  { code: '+61',  label: '+61 (Australia)',   flag: '🇦🇺' },
  { code: '+91',  label: '+91 (India)',       flag: '🇮🇳' },
  { code: '+81',  label: '+81 (Japan)',       flag: '🇯🇵' },
  { code: '+82',  label: '+82 (South Korea)', flag: '🇰🇷' },
  { code: '+86',  label: '+86 (China)',       flag: '🇨🇳' },
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

function getAvailabilityColor(cls: Class) {
  if (cls.isBooked) return 'burg'
  if (cls.isFull) return 'red'
  if (cls.availableSpots <= 2) return 'yellow'
  return 'green'
}

const dotColors: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  burg: 'bg-burg',
}

function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const cells: Array<{ day: number; dateKey: string } | null> = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const dateKey = dt.toLocaleDateString('en-CA')
    cells.push({ day: d, dateKey })
  }
  return cells
}

const inputClass = 'bg-warm-white border border-rule text-ink rounded-lg px-3 py-1.5 text-base focus:outline-none focus:border-burg'

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
    </svg>
  )
}

interface FieldRowProps {
  field: string
  label: string
  display: React.ReactNode
  initialValue: string
  isEditing: boolean
  fieldError: string | null
  fieldSaving: boolean
  onStartEdit: (field: string) => void
  onSave: (field: string, value: string) => void
  onCancel: () => void
}

// FieldRow owns its own input state so parent re-renders never affect the focused input.
// The parent uses `key` to remount this component when editing starts, giving it fresh state.
function FieldRow({
  field, label, display, initialValue,
  isEditing, fieldError, fieldSaving,
  onStartEdit, onSave, onCancel,
}: FieldRowProps) {
  const initPhone = field === 'phone' ? parsePhone(initialValue) : { code: '+1', number: '' }
  const initValue = (() => {
    if (field === 'birthday' && initialValue) {
      try { return new Date(initialValue).toISOString().split('T')[0] } catch { return '' }
    }
    return field === 'phone' ? '' : initialValue
  })()

  const [localValue, setLocalValue] = useState(initValue)
  const [localPhoneCode, setLocalPhoneCode] = useState(initPhone.code)
  const [localPhoneNumber, setLocalPhoneNumber] = useState(initPhone.number)

  // Capture originals once at mount for hasChanged comparison
  const origRef = useRef({ value: initValue, phoneCode: initPhone.code, phoneNumber: initPhone.number })

  // Explicit focus ref — more reliable than autoFocus in Next.js hydration context
  const primaryInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isEditing) {
      const id = requestAnimationFrame(() => primaryInputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [isEditing])

  const hasChanged = isEditing
    ? field === 'phone'
      ? localPhoneCode !== origRef.current.phoneCode || localPhoneNumber !== origRef.current.phoneNumber
      : localValue !== origRef.current.value
    : false

  const handleSave = () => {
    const value = field === 'phone' ? `${localPhoneCode}${localPhoneNumber}` : localValue
    onSave(field, value)
  }

  const renderInput = () => {
    if (field === 'phone') {
      return (
        <div className="flex gap-2">
          <select
            value={localPhoneCode}
            onChange={e => setLocalPhoneCode(e.target.value)}
            className={`${inputClass} flex-shrink-0`}
          >
            {COUNTRY_CODES.map(({ code, flag, label: lbl }) => (
              <option key={code} value={code}>{flag} {lbl}</option>
            ))}
          </select>
          <input ref={primaryInputRef} type="text" inputMode="numeric" value={localPhoneNumber}
            onChange={e => setLocalPhoneNumber(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.stopPropagation()}
            placeholder="1234567890" className={`${inputClass} flex-1 min-w-0`}
            autoComplete="new-password" />
        </div>
      )
    }
    if (field === 'birthday') {
      return <BirthdayPicker value={localValue} onChange={setLocalValue} inputClass={inputClass} />
    }
    return (
      <input
        ref={primaryInputRef}
        type={field === 'email' ? 'email' : 'text'}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        className={inputClass}
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    )
  }

  return (
    <div className="group">
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-mgray tracking-wider uppercase">{label}</label>
        {!isEditing && (
          <button type="button" onClick={() => onStartEdit(field)} className="opacity-0 group-hover:opacity-100 text-lgray hover:text-burg transition-opacity" title={`Edit ${label}`}>
            <PencilIcon />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          {renderInput()}
          {fieldError && <p className="text-burg text-xs">{fieldError}</p>}
          <div className="flex gap-2">
            {hasChanged && (
              <button type="button" onClick={handleSave} disabled={fieldSaving}
                className="px-3 py-1 bg-burg hover:bg-burg-mid disabled:opacity-50 text-warm-white text-sm font-medium rounded-lg transition tracking-wide">
                {fieldSaving ? 'Saving…' : 'Save'}
              </button>
            )}
            <button type="button" onClick={() => { (document.activeElement as HTMLElement)?.blur(); onCancel() }} disabled={fieldSaving}
              className="px-3 py-1 bg-bone hover:bg-bone-dk text-ink text-sm rounded-lg transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-ink text-base">{display}</p>
      )}
    </div>
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

  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldSaving, setFieldSaving] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  // Calendar state
  const [classes, setClasses] = useState<Class[]>([])
  const [processingClass, setProcessingClass] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const today = useMemo(() => new Date(), [])
  const todayKey = today.toLocaleDateString('en-CA')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchClasses = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/classes/available?userId=${userId}`)
      const data = await response.json()
      if (response.ok) setClasses(data.classes)
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }, [])

  const fetchUpcomingBookings = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/user/bookings?userId=${userId}`)
      const data = await response.json()
      if (response.ok) setUpcomingBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }, [])

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
      const response = await fetch('/api/user/profile-picture', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = localStorage.getItem('user')
      if (!userData) { router.push('/login'); return }
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setProfilePicture(parsedUser.profilePicture || null)
      try {
        const creditsRes = await fetch(`/api/user/credits?userId=${parsedUser.id}`)
        const creditsData = await creditsRes.json()
        if (creditsRes.ok) setTotalCredits(creditsData.totalCredits || 0)
        await Promise.all([
          fetchClasses(parsedUser.id),
          fetchUpcomingBookings(parsedUser.id),
        ])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }
    fetchUserData()
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) fetchUserData() }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router, fetchClasses, fetchUpcomingBookings])

  // Calendar memos
  const groupedByDay = useMemo(() => {
    const groups: Map<string, Class[]> = new Map()
    for (const cls of classes) {
      const dateKey = new Date(cls.startTime).toLocaleDateString('en-CA')
      if (!groups.has(dateKey)) groups.set(dateKey, [])
      groups.get(dateKey)!.push(cls)
    }
    return groups
  }, [classes])

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
        toast.error(data.error || 'Booking failed', { style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #ef4444' } })
        return
      }
      toast.success(`Class booked! Your reformer is #${data.booking.stretcherNumber}`, {
        duration: 4000,
        style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #22c55e' },
      })
      setTotalCredits(c => Math.max(0, c - 1))
      await Promise.all([fetchClasses(user.id), fetchUpcomingBookings(user.id)])
    } catch {
      toast.error('Network error. Please try again.', { style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #ef4444' } })
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
        toast.error(data.error || 'Cancellation failed', { style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #ef4444' } })
        return
      }
      toast.success('Booking cancelled. Your credit has been reinstated.', {
        duration: 4000,
        style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #22c55e' },
      })
      setTotalCredits(c => c + 1)
      await Promise.all([fetchClasses(user.id), fetchUpcomingBookings(user.id)])
    } catch {
      toast.error('Network error. Please try again.', { style: { background: '#FAFAF7', color: '#1A1512', border: '1px solid #ef4444' } })
    } finally {
      setProcessingClass(null)
    }
  }

  const startEditField = (field: string) => {
    setEditingField(field)
    setFieldError(null)
  }

  const cancelEditField = () => {
    setEditingField(null)
    setFieldError(null)
  }

  const saveField = async (field: string, value: string) => {
    setFieldSaving(true)
    setFieldError(null)
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
        await fetchClasses(user.id)
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const fieldRowShared = {
    fieldError, fieldSaving,
    onStartEdit: startEditField,
    onSave: saveField,
    onCancel: cancelEditField,
  }

  return (
    <div className="min-h-screen bg-cream px-8 pt-0 pb-8">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="OOMA Wellness" className="h-[560px] w-auto -mt-[200px] -mb-[220px]" style={{ mixBlendMode: 'multiply' }} />
          <button onClick={handleLogout}
            className="px-4 py-2 border border-rule text-mgray hover:border-burg hover:text-burg rounded-lg transition text-sm tracking-wide">
            Logout
          </button>
        </div>

        {/* 1. Profile Card */}
        <div className="bg-warm-white rounded-2xl p-8 border border-rule mb-6">
          <h2 className="text-4xl font-serif font-light text-ink mb-6 tracking-wide">My <em className="text-burg">Profile</em></h2>

          {/* Profile Picture + Fields */}
          <div className="flex items-start gap-8 mb-6">
            <div className="flex-shrink-0">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-48 h-48 rounded-full overflow-hidden cursor-pointer group border-2 transition-colors ${
                  isDragging ? 'border-burg' : 'border-rule hover:border-burg'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.heic,.heif" className="hidden" onChange={handleFileChange} />
                {profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/user/profile-picture?userId=${user?.id}&v=${pictureVersion}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-bone flex items-center justify-center">
                    <svg className="w-10 h-10 text-lgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className={`absolute inset-0 bg-ink/40 flex items-center justify-center transition-opacity ${uploadStatus === 'uploading' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploadStatus === 'uploading' ? (
                    <div className="w-5 h-5 border-2 border-warm-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-warm-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
              {uploadStatus === 'success' && <p className="mt-2 text-green-700 text-xs">Updated!</p>}
              {uploadStatus === 'error' && uploadError && <p className="mt-2 text-burg text-xs">{uploadError}</p>}
            </div>

            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-6">
              <FieldRow key={editingField === 'name' ? 'name-e' : 'name'} {...fieldRowShared} field="name" label="First Name" display={user.name} initialValue={user.name || ''} isEditing={editingField === 'name'} />
              <FieldRow key={editingField === 'lastName' ? 'lastName-e' : 'lastName'} {...fieldRowShared} field="lastName" label="Last Name" display={user.lastName} initialValue={user.lastName || ''} isEditing={editingField === 'lastName'} />
              <FieldRow key={editingField === 'email' ? 'email-e' : 'email'} {...fieldRowShared} field="email" label="Email" display={user.email} initialValue={user.email || ''} isEditing={editingField === 'email'} />
              <FieldRow key={editingField === 'phone' ? 'phone-e' : 'phone'} {...fieldRowShared} field="phone" label="Phone" display={user.phone} initialValue={user.phone || ''} isEditing={editingField === 'phone'} />
              <FieldRow key={editingField === 'birthday' ? 'birthday-e' : 'birthday'} {...fieldRowShared} field="birthday" label="Birthday" display={user.birthday ? new Date(user.birthday).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '—'} initialValue={user.birthday || ''} isEditing={editingField === 'birthday'} />
            </div>
          </div>

          {/* Credits */}
          <div className="border-t border-rule pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium text-mgray tracking-wider uppercase mb-1">Class Credits</p>
                <p className="text-ink text-lg">
                  <span className="text-burg font-serif font-light text-5xl">{totalCredits}</span>{' '}
                  <span className="text-mgray text-base">{totalCredits === 1 ? 'class' : 'classes'} remaining</span>
                </p>
                {totalCredits === 0 && (
                  <p className="text-mgray text-sm mt-1">Purchase a package to start booking classes!</p>
                )}
              </div>
              <button onClick={() => router.push('/packages')}
                className="px-6 py-3 bg-ink hover:bg-burg text-warm-white font-medium rounded-lg transition tracking-wider text-sm uppercase">
                Buy More Classes
              </button>
            </div>
          </div>
        </div>

        {/* 2. My Upcoming Classes */}
        <div className="bg-warm-white rounded-2xl p-8 border border-rule mb-6">
          <h2 className="text-2xl font-serif font-light text-ink mb-4 tracking-wide">My Upcoming <em className="text-burg">Classes</em></h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-mgray text-sm">No upcoming classes booked yet.</p>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-bone rounded-lg p-4 border border-rule">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-serif font-light text-ink tracking-wide">{booking.class.title}</h3>
                    <span className="px-3 py-1 bg-burg text-warm-white text-xs font-medium rounded-full">
                      Reformer #{booking.stretcherNumber}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm mb-3">
                    <p className="text-mgray">
                      {new Date(booking.class.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-mgray">
                      {new Date(booking.class.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} –{' '}
                      {new Date(booking.class.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {booking.class.instructor && <p className="text-mgray">{booking.class.instructor}</p>}
                  </div>
                  <button onClick={() => handleCancelBooking(booking)} disabled={cancellingId === booking.id}
                    className="px-4 py-1.5 border border-rule hover:border-burg disabled:opacity-50 text-mgray hover:text-burg text-sm font-medium rounded-lg transition">
                    {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Calendar */}
        <div className="bg-warm-white rounded-2xl p-8 border border-rule">
          <h2 className="text-2xl font-serif font-light text-ink mb-6 tracking-wide">My <em className="text-burg">Calendar</em></h2>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={goToPrevMonth} className="text-mgray hover:text-burg p-2 rounded-lg hover:bg-bone transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-serif font-light text-ink tracking-wide">{monthLabel}</h3>
            <button onClick={goToNextMonth} className="text-mgray hover:text-burg p-2 rounded-lg hover:bg-bone transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-medium text-lgray py-1 tracking-wider">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1 mb-8">
            {calendarCells.map((cell, i) => {
              if (!cell) return <div key={`blank-${i}`} />
              const hasClasses = groupedByDay.has(cell.dateKey)
              const isSelected = selectedDay === cell.dateKey
              const isToday = cell.dateKey === todayKey
              return (
                <button key={cell.dateKey}
                  onClick={() => hasClasses && setSelectedDay(cell.dateKey)}
                  disabled={!hasClasses}
                  className={`relative flex items-center justify-center py-2 sm:py-3 rounded-lg transition-all ${
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
                </button>
              )
            })}
          </div>

          {/* Classes for selected day */}
          {!selectedDay ? (
            <div className="bg-bone rounded-xl p-6 text-center">
              <p className="text-mgray text-sm">Select a day to see available classes.</p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-serif font-light text-ink mb-4 tracking-wide">
                {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              {selectedClasses.length === 0 ? (
                <div className="bg-bone rounded-xl p-6 text-center">
                  <p className="text-mgray text-sm">No classes available on this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedClasses.map(cls => {
                    const isProcessing = processingClass === cls.id
                    const color = getAvailabilityColor(cls)
                    const badgeStyles: Record<string, string> = {
                      burg: 'bg-burg-pale/30 text-burg border border-burg',
                      red: 'bg-red-50 text-red-600 border border-red-300',
                      yellow: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
                      green: 'bg-green-50 text-green-700 border border-green-300',
                    }
                    const badgeText = cls.isBooked
                      ? `Reformer #${cls.userStretcherNumber}`
                      : cls.isFull ? 'Full' : `${cls.availableSpots} spots left`

                    return (
                      <div key={cls.id} className={`bg-bone rounded-xl p-6 border ${cls.isBooked ? 'border-burg/40' : 'border-rule'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-xl font-serif font-light text-ink mb-1 tracking-wide">{cls.title}</h4>
                            {cls.description && <p className="text-mgray text-sm">{cls.description}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${dotColors[color]}`} />
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeStyles[color]}`}>{badgeText}</span>
                          </div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-mgray text-sm">
                            <svg className="w-4 h-4 text-burg flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(cls.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} –{' '}
                            {new Date(cls.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {cls.instructor && (
                            <div className="flex items-center gap-2 text-mgray text-sm">
                              <svg className="w-4 h-4 text-burg flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {cls.instructor}
                            </div>
                          )}
                        </div>
                        {cls.isBooked ? (
                          <button onClick={() => handleCancelClass(cls.id)} disabled={isProcessing}
                            className={`w-full py-3 rounded-lg font-medium transition tracking-wider text-sm uppercase ${
                              isProcessing ? 'bg-bone text-lgray cursor-not-allowed' : 'border border-rule text-mgray hover:border-burg hover:text-burg'
                            }`}>
                            {isProcessing ? 'Cancelling...' : 'Cancel Booking'}
                          </button>
                        ) : (
                          <button
                            onClick={() => totalCredits === 0 ? router.push('/packages') : handleBookClass(cls.id)}
                            disabled={cls.isFull || isProcessing}
                            className={`w-full py-3 rounded-lg font-medium transition tracking-wider text-sm uppercase ${
                              cls.isFull ? 'bg-bone text-lgray cursor-not-allowed'
                              : isProcessing ? 'bg-burg-soft text-warm-white cursor-not-allowed'
                              : 'bg-ink hover:bg-burg text-warm-white'
                            }`}>
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
    </div>
  )
}

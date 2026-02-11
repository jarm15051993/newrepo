'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user')
    
    if (!userData) {
      // Not logged in, redirect to login
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    setLoading(false)
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
          <p className="text-white text-lg">You have <span className="text-amber-400 font-bold">0</span> classes remaining</p>
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
          <p className="text-gray-400">No upcoming classes booked yet.</p>
          <button className="mt-4 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-semibold rounded-lg transition">
            Book a Class
          </button>
        </div>
      </div>
    </div>
  )
}
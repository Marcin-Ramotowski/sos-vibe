'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/presentation/hooks/use-auth'
import { Footer } from '@/presentation/components/ui/Footer'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') router.replace('/admin/courses')
      else if (user.role === 'LECTURER') router.replace('/lecturer/courses')
      else router.replace('/student/courses')
    }
  }, [user, loading, router])

  if (loading || user) return null

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-field.jpg')" }}
    >
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">SOS</h1>
          <p className="text-gray-500 text-lg mb-10">System Obsługi Studiów</p>
          <Link
            href="/login"
            className="inline-block bg-amber-400 hover:bg-amber-500 text-white font-semibold px-10 py-3.5 rounded-full transition-colors text-base"
          >
            Logowanie
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/presentation/components/ui/NavBar'
import { useAuth } from '@/presentation/hooks/use-auth'

const lecturerLinks = [{ href: '/lecturer/courses', label: 'Moje Kursy' }]

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'STUDENT') {
        router.replace('/student/courses')
      } else if (user.role === 'ADMIN') {
        router.replace('/admin/courses')
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'LECTURER') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar links={lecturerLinks} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

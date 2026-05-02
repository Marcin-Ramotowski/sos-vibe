'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/presentation/components/ui/NavBar'
import { useAuth } from '@/presentation/hooks/use-auth'

const studentLinks = [
  { href: '/student/courses', label: 'Dostępne Kursy' },
  { href: '/student/my-courses', label: 'Moje Kursy' },
  { href: '/student/grades', label: 'Oceny' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'ADMIN') {
        router.replace('/admin/courses')
      } else if (user.role === 'LECTURER') {
        router.replace('/lecturer/courses')
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'STUDENT') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar links={studentLinks} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

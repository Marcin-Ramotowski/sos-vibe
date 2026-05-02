'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NavBar } from '@/presentation/components/ui/NavBar'
import { useAuth } from '@/presentation/hooks/use-auth'

const adminLinks = [
  { href: '/admin/courses', label: 'Kursy' },
  { href: '/admin/users', label: 'Użytkownicy' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'STUDENT') {
        router.replace('/student/courses')
      } else if (user.role === 'LECTURER') {
        router.replace('/lecturer/courses')
      }
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'ADMIN') return null

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar links={adminLinks} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

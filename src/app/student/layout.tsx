'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/presentation/components/ui/Sidebar'
import { Footer } from '@/presentation/components/ui/Footer'
import { useAuth } from '@/presentation/hooks/use-auth'

const studentLinks = [
  { href: '/student/courses', label: 'Przedmioty' },
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
    <div className="flex min-h-screen">
      <Sidebar links={studentLinks} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-8 bg-gray-50">{children}</main>
        <Footer />
      </div>
    </div>
  )
}

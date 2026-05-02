import { NavBar } from '@/presentation/components/ui/NavBar'

const studentLinks = [
  { href: '/student/courses', label: 'Dostępne Kursy' },
  { href: '/student/my-courses', label: 'Moje Kursy' },
  { href: '/student/grades', label: 'Oceny' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar links={studentLinks} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

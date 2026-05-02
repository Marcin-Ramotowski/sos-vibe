import { NavBar } from '@/presentation/components/ui/NavBar'

const adminLinks = [
  { href: '/admin/courses', label: 'Kursy' },
  { href: '/admin/users', label: 'Użytkownicy' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar links={adminLinks} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

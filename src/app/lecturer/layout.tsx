import { NavBar } from '@/presentation/components/ui/NavBar'

const lecturerLinks = [{ href: '/lecturer/courses', label: 'Moje Kursy' }]

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar links={lecturerLinks} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

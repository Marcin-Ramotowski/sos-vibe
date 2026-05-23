'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/presentation/hooks/use-auth'

interface NavLink {
  href: string
  label: string
}

interface SidebarProps {
  links: NavLink[]
}

export function Sidebar({ links }: SidebarProps) {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()

  if (loading) return null

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <aside className="w-60 min-h-screen bg-gray-100 flex flex-col border-r border-gray-200 flex-shrink-0">
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-bold text-gray-900 tracking-tight">SOS</span>
        <p className="text-xs text-gray-500 mt-0.5">System Obsługi Studiów</p>
      </div>

      <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {initials}
        </div>
        {user && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors"
        >
          Wyloguj
        </button>
      </div>
    </aside>
  )
}

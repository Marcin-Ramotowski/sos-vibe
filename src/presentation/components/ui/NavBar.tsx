'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/presentation/hooks/use-auth'

interface NavLink {
  href: string
  label: string
}

interface NavBarProps {
  links: NavLink[]
}

export function NavBar({ links }: NavBarProps) {
  const { user, loading, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) { setUnreadCount(0); return }
    fetch('/api/notifications')
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        setUnreadCount(Array.isArray(data) ? (data as unknown[]).length : 0)
      })
      .catch(() => {}) // badge silently fails — non-critical
  }, [user])

  if (loading) return null

  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <span className="font-bold text-xl">SOS</span>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-blue-200 transition-colors text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {unreadCount > 0 && (
          <div className="relative">
            <span className="text-xl" aria-label="Powiadomienia">🔔</span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
        {user && (
          <span className="text-sm text-blue-100">
            {user.firstName} {user.lastName}
          </span>
        )}
        <button
          onClick={logout}
          className="text-sm bg-blue-800 hover:bg-blue-900 px-3 py-1 rounded transition-colors"
        >
          Wyloguj
        </button>
      </div>
    </nav>
  )
}

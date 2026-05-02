'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { User, UserRole } from '@/domain/entities/user.entity'

interface PaginatedUsers {
  data: User[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Student',
  LECTURER: 'Prowadzący',
  ADMIN: 'Administrator',
}

const ROLE_COLORS: Record<UserRole, string> = {
  STUDENT: 'bg-blue-100 text-blue-800',
  LECTURER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
}

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedUsers | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users?page=${page}&limit=20`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setUpdating(userId)
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.message ?? 'Błąd zmiany roli')
        return
      }
      toast.success('Rola zmieniona')
      fetchUsers()
    } catch {
      toast.error('Błąd połączenia')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Zarządzanie Użytkownikami</h1>

      {loading && <div className="text-center py-12 text-gray-500">Ładowanie...</div>}

      {!loading && data && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Użytkownik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rola
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Zmień rolę
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}
                      >
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={updating === user.id}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="LECTURER">Prowadzący</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Poprzednia
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Następna
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

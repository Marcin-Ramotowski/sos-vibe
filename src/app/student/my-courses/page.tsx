'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { EnrollmentWithDetails } from '@/domain/entities/enrollment.entity'
import { EnrollButton } from '@/presentation/components/enrollments/EnrollButton'

interface PaginatedEnrollments {
  data: EnrollmentWithDetails[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function MyCoursesPage() {
  const [data, setData] = useState<PaginatedEnrollments | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchEnrollments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/enrollments?page=${page}&limit=20`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moje Kursy</h1>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {!loading && data && (
        <>
          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              Nie jesteś zapisany na żaden kurs.{' '}
              <Link href="/student/courses" className="text-blue-600 hover:underline">
                Przeglądaj przedmioty
              </Link>
            </div>
          )}

          {data.data.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Kurs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Prowadzący
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ocena
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{enrollment.course.name}</div>
                        {enrollment.course.description && (
                          <div className="text-sm text-gray-400 mt-0.5 line-clamp-1">
                            {enrollment.course.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {enrollment.course.lecturer ? (
                          `${enrollment.course.lecturer.firstName} ${enrollment.course.lecturer.lastName}`
                        ) : (
                          <span className="text-gray-400 italic">Brak</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {enrollment.grade ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-green-100 text-green-800">
                            {enrollment.grade.value.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <EnrollButton
                          courseId={enrollment.courseId}
                          status="ENROLLED"
                          onStatusChange={fetchEnrollments}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Poprzednia
              </button>
              <span className="text-sm text-gray-500">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

'use client'

import { useState, useEffect, useCallback } from 'react'
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

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moje Kursy</h1>

      {loading && <div className="text-center py-12 text-gray-500">Ładowanie...</div>}

      {!loading && data && (
        <>
          {data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nie jesteś zapisany na żaden kurs.{' '}
              <a href="/student/courses" className="text-blue-600 hover:underline">
                Przeglądaj dostępne kursy
              </a>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {data.data.length > 0 && (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kurs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Prowadzący
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ocena
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{enrollment.course.name}</div>
                        {enrollment.course.description && (
                          <div className="text-sm text-gray-500 mt-1">{enrollment.course.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {enrollment.course.lecturer
                          ? `${enrollment.course.lecturer.firstName} ${enrollment.course.lecturer.lastName}`
                          : <span className="text-gray-400 italic">Brak</span>}
                      </td>
                      <td className="px-6 py-4">
                        {enrollment.grade ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-green-100 text-green-800">
                            {enrollment.grade.value.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Brak oceny</span>
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
            )}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Poprzednia
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                {page} / {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
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

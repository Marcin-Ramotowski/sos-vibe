'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GradeWithDetails } from '@/domain/entities/grade.entity'

interface PaginatedGrades {
  data: GradeWithDetails[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

function gradeColor(value: number): string {
  if (value < 3.0) return 'bg-red-100 text-red-800'
  if (value < 4.0) return 'bg-yellow-100 text-yellow-800'
  if (value < 5.0) return 'bg-blue-100 text-blue-800'
  return 'bg-green-100 text-green-800'
}

export default function StudentGradesPage() {
  const [data, setData] = useState<PaginatedGrades | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchGrades = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/grades/mine?page=${page}&limit=20`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchGrades()
  }, [fetchGrades])

  const average =
    data && data.data.length > 0
      ? (data.data.reduce((sum, g) => sum + g.value, 0) / data.data.length).toFixed(2)
      : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Moje Oceny</h1>
        {average && (
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700">
            Średnia:{' '}
            <span className="text-blue-600 font-bold text-base">{average}</span>
          </div>
        )}
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {!loading && data && (
        <>
          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-400">Brak ocen do wyświetlenia</div>
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
                      Ocena
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {grade.enrollment.course.name}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${gradeColor(grade.value)}`}
                        >
                          {grade.value.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(grade.updatedAt).toLocaleDateString('pl-PL')}
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

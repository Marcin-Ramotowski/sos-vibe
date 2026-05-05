'use client'

import { useState, useEffect, useCallback, use } from 'react'
import Link from 'next/link'
import { GradeSelect } from '@/presentation/components/grades/GradeSelect'

interface Student {
  id: string
  studentId: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  grade: {
    id: string
    value: number
  } | null
}

interface PaginatedStudents {
  data: Student[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function CourseStudentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const [data, setData] = useState<PaginatedStudents | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/students?page=${page}&limit=20`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [courseId, page])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/lecturer/courses"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Wróć do kursów
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Lista Studentów</h1>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {!loading && data && (
        <>
          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-400">Brak studentów na tym kursie</div>
          )}

          {data.data.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ocena
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {row.student.firstName} {row.student.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{row.student.email}</td>
                      <td className="px-6 py-4">
                        <GradeSelect
                          courseId={courseId}
                          studentId={row.studentId}
                          currentValue={row.grade?.value ?? null}
                          onGraded={fetchStudents}
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

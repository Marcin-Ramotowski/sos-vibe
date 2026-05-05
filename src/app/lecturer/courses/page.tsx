'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { CourseWithLecturer } from '@/domain/entities/course.entity'

interface PaginatedCourses {
  data: CourseWithLecturer[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function LecturerCoursesPage() {
  const [data, setData] = useState<PaginatedCourses | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses?page=${page}&limit=20`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moje Kursy</h1>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {!loading && data && (
        <>
          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              Nie masz przypisanych żadnych kursów
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.data.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <h3 className="font-semibold text-gray-900 text-base mb-2">{course.name}</h3>
                {course.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                )}
                <div className="text-xs text-gray-400 mb-4">
                  Zapisani:{' '}
                  <span className="font-medium text-gray-600">
                    {course.enrolledCount}/{course.capacity}
                  </span>
                </div>
                <Link
                  href={`/lecturer/courses/${course.id}/students`}
                  className="inline-block text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Lista studentów
                </Link>
              </div>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-3">
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

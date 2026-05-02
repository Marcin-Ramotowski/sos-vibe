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

  useEffect(() => { fetchCourses() }, [fetchCourses])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moje Kursy</h1>

      {loading && <div className="text-center py-12 text-gray-500">Ładowanie...</div>}

      {!loading && data && (
        <>
          {data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nie masz przypisanych żadnych kursów
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{course.name}</h3>
                {course.description && (
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                )}
                <div className="text-sm text-gray-500 mb-4">
                  Zapisani: {course.enrolledCount}/{course.capacity}
                </div>
                <Link
                  href={`/lecturer/courses/${course.id}/students`}
                  className="inline-block text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  Lista studentów
                </Link>
              </div>
            ))}
          </div>

          {data.pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
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

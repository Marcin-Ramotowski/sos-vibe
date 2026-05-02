'use client'

import { useState, useEffect, useCallback } from 'react'
import { EnrollButton } from '@/presentation/components/enrollments/EnrollButton'
import type { CourseWithStatus } from '@/domain/entities/course.entity'

interface PaginatedCourses {
  data: CourseWithStatus[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const STATUS_BADGE: Record<string, string> = {
  ENROLLED: 'bg-green-100 text-green-800',
  NOT_ENROLLED: 'bg-gray-100 text-gray-600',
  FULL: 'bg-red-100 text-red-800',
}

const STATUS_LABEL: Record<string, string> = {
  ENROLLED: 'Zapisany',
  NOT_ENROLLED: 'Dostępny',
  FULL: 'Brak miejsc',
}

export default function StudentCoursesPage() {
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dostępne Kursy</h1>

      {loading && <div className="text-center py-12 text-gray-500">Ładowanie...</div>}

      {!loading && data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.data.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{course.name}</h3>
                  {course.enrollmentStatus && (
                    <span
                      className={`ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[course.enrollmentStatus]}`}
                    >
                      {STATUS_LABEL[course.enrollmentStatus]}
                    </span>
                  )}
                </div>
                {course.description && (
                  <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                )}
                <div className="text-sm text-gray-500 mb-3">
                  <span>
                    Miejsca: {course.enrolledCount}/{course.capacity}
                  </span>
                  {course.lecturer && (
                    <span className="ml-3">
                      Prowadzący: {course.lecturer.firstName} {course.lecturer.lastName}
                    </span>
                  )}
                </div>
                {course.enrollmentStatus && (
                  <EnrollButton
                    courseId={course.id}
                    status={course.enrollmentStatus}
                    onStatusChange={fetchCourses}
                  />
                )}
              </div>
            ))}
          </div>

          {data.data.length === 0 && (
            <div className="text-center py-12 text-gray-500">Brak dostępnych kursów</div>
          )}

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

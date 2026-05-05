'use client'

import { useState, useEffect, useCallback } from 'react'
import { EnrollButton } from '@/presentation/components/enrollments/EnrollButton'
import type { CourseWithStatus } from '@/domain/entities/course.entity'

interface PaginatedCourses {
  data: CourseWithStatus[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const STATUS_BADGE: Record<string, string> = {
  ENROLLED: 'bg-green-100 text-green-700',
  NOT_ENROLLED: 'bg-gray-100 text-gray-500',
  FULL: 'bg-red-100 text-red-700',
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

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Przedmioty</h1>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {!loading && data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.data.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 text-base leading-snug">
                    {course.name}
                  </h3>
                  {course.enrollmentStatus && (
                    <span
                      className={`ml-2 flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[course.enrollmentStatus]}`}
                    >
                      {STATUS_LABEL[course.enrollmentStatus]}
                    </span>
                  )}
                </div>
                {course.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{course.description}</p>
                )}
                <div className="text-xs text-gray-400 mb-4 space-y-1">
                  <div>
                    Miejsca:{' '}
                    <span className="font-medium text-gray-600">
                      {course.enrolledCount}/{course.capacity}
                    </span>
                  </div>
                  {course.lecturer && (
                    <div>
                      Prowadzący:{' '}
                      <span className="font-medium text-gray-600">
                        {course.lecturer.firstName} {course.lecturer.lastName}
                      </span>
                    </div>
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
            <div className="text-center py-16 text-gray-400">Brak dostępnych przedmiotów</div>
          )}

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

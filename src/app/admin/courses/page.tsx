'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreateCourseDialog } from '@/presentation/components/courses/CreateCourseDialog'
import { AssignLecturerDialog } from '@/presentation/components/courses/AssignLecturerDialog'
import { EditCourseDialog } from '@/presentation/components/courses/EditCourseDialog'
import type { CourseWithLecturer } from '@/domain/entities/course.entity'

interface PaginatedCourses {
  data: CourseWithLecturer[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export default function AdminCoursesPage() {
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zarządzanie Kursami</h1>
        <CreateCourseDialog onCreated={fetchCourses} />
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {!loading && data && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nazwa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Prowadzący
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Miejsca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{course.name}</div>
                      {course.description && (
                        <div className="text-sm text-gray-400 mt-0.5 truncate max-w-xs">
                          {course.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {course.lecturer ? (
                        `${course.lecturer.firstName} ${course.lecturer.lastName}`
                      ) : (
                        <span className="text-gray-400 italic">Brak</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={
                          course.enrolledCount >= course.capacity
                            ? 'text-red-600 font-semibold'
                            : 'text-gray-600'
                        }
                      >
                        {course.enrolledCount}
                      </span>
                      <span className="text-gray-400">/{course.capacity}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <EditCourseDialog
                          courseId={course.id}
                          course={course}
                          onUpdated={fetchCourses}
                        />
                        <AssignLecturerDialog
                          courseId={course.id}
                          courseName={course.name}
                          currentLecturerId={course.lecturerId}
                          onAssigned={fetchCourses}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.data.length === 0 && (
            <div className="text-center py-16 text-gray-400">Brak kursów</div>
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

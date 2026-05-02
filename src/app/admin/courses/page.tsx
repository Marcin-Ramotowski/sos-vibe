'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreateCourseDialog } from '@/presentation/components/courses/CreateCourseDialog'
import { AssignLecturerDialog } from '@/presentation/components/courses/AssignLecturerDialog'
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

  useEffect(() => { fetchCourses() }, [fetchCourses])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Zarządzanie Kursami</h1>
        <CreateCourseDialog onCreated={fetchCourses} />
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Ładowanie...</div>}

      {!loading && data && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nazwa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prowadzący
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Miejsca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.data.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{course.name}</div>
                      {course.description && (
                        <div className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                          {course.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {course.lecturer
                        ? `${course.lecturer.firstName} ${course.lecturer.lastName}`
                        : <span className="text-gray-400 italic">Brak</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className={course.enrolledCount >= course.capacity ? 'text-red-600 font-medium' : ''}>
                        {course.enrolledCount}
                      </span>
                      /{course.capacity}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <AssignLecturerDialog
                        courseId={course.id}
                        courseName={course.name}
                        currentLecturerId={course.lecturerId}
                        onAssigned={fetchCourses}
                      />
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

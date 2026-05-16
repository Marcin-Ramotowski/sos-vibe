'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { EnrollButton } from '@/presentation/components/enrollments/EnrollButton'
import type { CourseWithStatus } from '@/domain/entities/course.entity'

interface PaginatedCourses {
  data: CourseWithStatus[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface Lecturer {
  id: string
  firstName: string
  lastName: string
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
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [available, setAvailable] = useState(false)
  const [lecturerId, setLecturerId] = useState('')
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const isFirstLoad = useRef(true)

  const buildUrl = useCallback(
    (p: number) => {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (search) params.set('search', search)
      if (available) params.set('available', 'true')
      if (lecturerId) params.set('lecturerId', lecturerId)
      return `/api/courses?${params.toString()}`
    },
    [search, available, lecturerId],
  )

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(buildUrl(page))
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [page, buildUrl])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Populate lecturer dropdown once from the initial unfiltered course list
  useEffect(() => {
    if (!isFirstLoad.current) return
    isFirstLoad.current = false
    fetch('/api/courses?limit=100')
      .then((r) => (r.ok ? r.json() : null))
      .then((result: PaginatedCourses | null) => {
        if (!result) return
        const seen = new Set<string>()
        const list: Lecturer[] = []
        for (const course of result.data) {
          if (course.lecturer && !seen.has(course.lecturer.id)) {
            seen.add(course.lecturer.id)
            list.push(course.lecturer)
          }
        }
        setLecturers(list.sort((a, b) => a.lastName.localeCompare(b.lastName)))
      })
  }, [])

  const handleFilterChange = useCallback((updater: () => void) => {
    updater()
    setPage(1)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange(() => setSearch(searchInput))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Przedmioty</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Szukaj po nazwie..."
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Szukaj
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => handleFilterChange(() => setAvailable(e.target.checked))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Tylko wolne miejsca
        </label>

        {lecturers.length > 0 && (
          <select
            value={lecturerId}
            onChange={(e) => handleFilterChange(() => setLecturerId(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Wszyscy prowadzący</option>
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.lastName} {l.firstName}
              </option>
            ))}
          </select>
        )}

        {(search || available || lecturerId) && (
          <button
            type="button"
            onClick={() => {
              setSearchInput('')
              setSearch('')
              setAvailable(false)
              setLecturerId('')
              setPage(1)
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Wyczyść
          </button>
        )}
      </form>

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
            <div className="text-center py-16 text-gray-400">
              Brak przedmiotów spełniających kryteria
            </div>
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

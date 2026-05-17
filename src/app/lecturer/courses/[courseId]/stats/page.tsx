'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface CourseStats {
  mean: number
  median: number
  passRate: number
  distribution: Record<string, number>
}

const GRADE_LABELS: Record<string, string> = {
  '2': 'ndst (2,0)',
  '3': 'dst (3,0)',
  '3.5': 'dst+ (3,5)',
  '4': 'db (4,0)',
  '4.5': 'db+ (4,5)',
  '5': 'bdb (5,0)',
  '5.5': 'cel (5,5)',
}

export default function CourseStatsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = use(params)
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/courses/${courseId}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('Błąd ładowania statystyk')
        return res.json()
      })
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [courseId])

  const total = stats
    ? Object.values(stats.distribution).reduce((s, n) => s + n, 0)
    : 0

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/lecturer/courses/${courseId}/students`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Wróć do listy studentów
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Statystyki kursu</h1>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Ładowanie...</div>}

      {error && (
        <div className="text-center py-16 text-red-500">{error}</div>
      )}

      {!loading && !error && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Średnia"
              value={total === 0 ? '—' : stats.mean.toFixed(2)}
            />
            <StatCard
              label="Mediana"
              value={total === 0 ? '—' : stats.median.toFixed(1)}
            />
            <StatCard
              label="Zaliczonych"
              value={total === 0 ? '—' : `${stats.passRate.toFixed(1)}%`}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Rozkład ocen
            </h2>
            {total === 0 ? (
              <p className="text-gray-400 text-sm">Brak wystawionych ocen</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.distribution).map(([grade, count]) => {
                  const pct = total > 0 ? (count / total) * 100 : 0
                  return (
                    <div key={grade} className="flex items-center gap-3">
                      <span className="w-28 text-sm text-gray-600 shrink-0">
                        {GRADE_LABELS[grade] ?? grade}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-2.5 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm text-gray-500 text-right shrink-0">
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

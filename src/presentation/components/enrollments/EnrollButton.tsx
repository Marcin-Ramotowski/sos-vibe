'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { EnrollmentStatus } from '@/domain/entities/course.entity'

interface EnrollButtonProps {
  courseId: string
  status: EnrollmentStatus
  onStatusChange: () => void
}

export function EnrollButton({ courseId, status, onStatusChange }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleEnroll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.message ?? 'Błąd zapisu')
        return
      }
      toast.success('Zapisano na kurs')
      onStatusChange()
    } catch {
      toast.error('Błąd połączenia')
    } finally {
      setLoading(false)
    }
  }

  const handleUnenroll = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/enrollments/${courseId}`, { method: 'DELETE' })
      if (res.status === 409) {
        const body = await res.json()
        toast.error(body.message ?? 'Nie można wypisać')
        return
      }
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.message ?? 'Błąd wypisywania')
        return
      }
      toast.success('Wypisano z kursu')
      onStatusChange()
    } catch {
      toast.error('Błąd połączenia')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'ENROLLED') {
    return (
      <button
        onClick={handleUnenroll}
        disabled={loading}
        className="px-3 py-1 text-sm bg-red-100 text-red-700 border border-red-300 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
      >
        {loading ? '...' : 'Wypisz się'}
      </button>
    )
  }

  if (status === 'FULL') {
    return (
      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-500 rounded border">
        Brak miejsc
      </span>
    )
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Zapisz się'}
    </button>
  )
}

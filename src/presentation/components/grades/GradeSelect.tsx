'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { VALID_GRADES } from '@/domain/entities/grade.entity'

interface GradeSelectProps {
  courseId: string
  studentId: string
  currentValue: number | null
  onGraded: () => void
}

export function GradeSelect({ courseId, studentId, currentValue, onGraded }: GradeSelectProps) {
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState<string>(currentValue?.toString() ?? '')

  const handleChange = async (newVal: string) => {
    setValue(newVal)
    if (!newVal) return

    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/students/${studentId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parseFloat(newVal) }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.message ?? 'Błąd wystawiania oceny')
        setValue(currentValue?.toString() ?? '')
        return
      }
      toast.success('Ocena zapisana')
      onGraded()
    } catch {
      toast.error('Błąd połączenia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="">-- Ocena --</option>
      {VALID_GRADES.map((g) => (
        <option key={g} value={g.toString()}>
          {g.toFixed(1)}
        </option>
      ))}
    </select>
  )
}

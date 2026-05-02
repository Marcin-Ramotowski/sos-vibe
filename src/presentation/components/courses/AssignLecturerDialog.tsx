'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Lecturer {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AssignLecturerDialogProps {
  courseId: string
  courseName: string
  currentLecturerId: string | null
  onAssigned: () => void
}

export function AssignLecturerDialog({
  courseId,
  courseName,
  currentLecturerId,
  onAssigned,
}: AssignLecturerDialogProps) {
  const [open, setOpen] = useState(false)
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [selectedId, setSelectedId] = useState(currentLecturerId ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/users?limit=100')
        .then((r) => r.json())
        .then((data) => {
          const filtered = (data.data ?? []).filter(
            (u: Lecturer & { role: string }) => u.role === 'LECTURER' || u.role === 'ADMIN',
          )
          setLecturers(filtered)
        })
        .catch(() => toast.error('Błąd ładowania prowadzących'))
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedId) {
      toast.error('Wybierz prowadzącego')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/lecturer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecturerId: selectedId }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.message ?? 'Błąd przypisywania')
        return
      }
      toast.success('Prowadzący przypisany')
      setOpen(false)
      onAssigned()
    } catch {
      toast.error('Błąd połączenia')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Przypisz prowadzącego
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-1">Przypisz prowadzącego</h2>
        <p className="text-gray-600 text-sm mb-4">{courseName}</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prowadzący</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Wybierz --</option>
            {lecturers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.firstName} {l.lastName} ({l.email})
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Anuluj
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Zapisywanie...' : 'Przypisz'}
          </button>
        </div>
      </div>
    </div>
  )
}

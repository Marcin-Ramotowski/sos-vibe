'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import type { CourseWithLecturer } from '@/domain/entities/course.entity'

const schema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').optional(),
  description: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Min. 1 miejsce').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  enrollmentDeadline: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
}

interface EditCourseDialogProps {
  courseId: string
  course: CourseWithLecturer
  onUpdated: () => void
}

export function EditCourseDialog({ courseId, course, onUpdated }: EditCourseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as unknown as import('react-hook-form').Resolver<FormData>,
    defaultValues: {
      name: course.name,
      description: course.description ?? '',
      capacity: course.capacity,
      startDate: toDateInputValue(course.startDate),
      endDate: toDateInputValue(course.endDate),
      enrollmentDeadline: toDateInputValue(course.enrollmentDeadline),
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate || null,
          endDate: data.endDate || null,
          enrollmentDeadline: data.enrollmentDeadline || null,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        toast.error(body.message ?? 'Błąd edycji kursu')
        return
      }
      toast.success('Kurs został zaktualizowany')
      setOpen(false)
      onUpdated()
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
        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
      >
        Edytuj
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div role="dialog" aria-modal="true" className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edytuj Kurs</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa kursu</label>
            <input
              {...register('name')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opis (opcjonalny)</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit miejsc</label>
            <input
              type="number"
              {...register('capacity')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            {errors.capacity && (
              <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data rozpoczęcia (opcjonalnie)
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data zakończenia (opcjonalnie)
            </label>
            <input
              type="date"
              {...register('endDate')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Termin zapisów (opcjonalnie)
            </label>
            <input
              type="date"
              {...register('enrollmentDeadline')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.enrollmentDeadline && (
              <p className="mt-1 text-sm text-red-600">{errors.enrollmentDeadline.message}</p>
            )}
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => { setOpen(false); reset() }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

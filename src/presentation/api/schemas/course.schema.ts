import { z } from 'zod'

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(255),
  description: z.string().max(1000).optional(),
  capacity: z.number().int().min(1, 'Pojemność musi być większa niż 0').max(1000),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  enrollmentDeadline: z.coerce.date().optional(),
})

export const updateCourseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  capacity: z.number().int().min(1).max(1000).optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  enrollmentDeadline: z.coerce.date().nullable().optional(),
})

export const assignLecturerSchema = z.object({
  lecturerId: z.string().uuid('Nieprawidłowe ID prowadzącego'),
})

export const courseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().min(1).max(255).optional(),
  available: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  lecturerId: z.string().uuid('Nieprawidłowe ID wykładowcy').optional(),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>
export type AssignLecturerInput = z.infer<typeof assignLecturerSchema>
export type CourseQueryInput = z.infer<typeof courseQuerySchema>

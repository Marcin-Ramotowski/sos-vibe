import { z } from 'zod'

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(255),
  description: z.string().max(1000).optional(),
  capacity: z.number().int().min(1, 'Pojemność musi być większa niż 0').max(1000),
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
export type AssignLecturerInput = z.infer<typeof assignLecturerSchema>
export type CourseQueryInput = z.infer<typeof courseQuerySchema>

import { z } from 'zod'

export const createCourseSchema = z.object({
  name: z.string().min(1, 'Nazwa jest wymagana').max(255),
  description: z.string().max(1000).optional(),
  capacity: z.number().int().min(1, 'Pojemność musi być większa niż 0').max(1000),
})

export const assignLecturerSchema = z.object({
  lecturerId: z.string().uuid('Nieprawidłowe ID prowadzącego'),
})

export type CreateCourseInput = z.infer<typeof createCourseSchema>
export type AssignLecturerInput = z.infer<typeof assignLecturerSchema>

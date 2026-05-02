import { z } from 'zod'
import { VALID_GRADES } from '@/domain/entities/grade.entity'

export const upsertGradeSchema = z.object({
  value: z.number().refine(
    (v) => VALID_GRADES.includes(v as (typeof VALID_GRADES)[number]),
    { message: 'Nieprawidłowa ocena. Dozwolone: 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5' },
  ),
})

export const updateRoleSchema = z.object({
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
})

export type UpsertGradeInput = z.infer<typeof upsertGradeSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

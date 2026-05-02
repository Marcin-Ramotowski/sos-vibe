import type { Grade, GradeWithDetails } from '../entities/grade.entity'
import type { PaginationParams, PaginatedResult } from './IUserRepository'

export interface UpsertGradeData {
  enrollmentId: string
  value: number
  gradedById: string
}

export interface IGradeRepository {
  findByEnrollmentId(enrollmentId: string): Promise<Grade | null>
  findByStudentId(studentId: string, params: PaginationParams): Promise<PaginatedResult<GradeWithDetails>>
  upsertWithAudit(data: UpsertGradeData): Promise<Grade>
}

import type { Enrollment, EnrollmentWithDetails } from '../entities/enrollment.entity'
import type { PaginationParams, PaginatedResult } from './IUserRepository'

export interface IEnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>
  findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollment | null>
  findByStudentId(studentId: string, params: PaginationParams): Promise<PaginatedResult<EnrollmentWithDetails>>
  enrollAtomic(studentId: string, courseId: string): Promise<Enrollment>
  unenroll(enrollmentId: string): Promise<void>
  hasGrade(enrollmentId: string): Promise<boolean>
}

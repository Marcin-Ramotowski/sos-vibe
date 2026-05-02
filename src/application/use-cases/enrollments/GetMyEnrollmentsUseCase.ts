import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { EnrollmentWithDetails } from '@/domain/entities/enrollment.entity'
import type { PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'

export class GetMyEnrollmentsUseCase {
  constructor(private readonly enrollmentRepo: IEnrollmentRepository) {}

  async execute(
    studentId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<EnrollmentWithDetails>> {
    return this.enrollmentRepo.findByStudentId(studentId, params)
  }
}

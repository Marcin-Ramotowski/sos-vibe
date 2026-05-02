import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import type { GradeWithDetails } from '@/domain/entities/grade.entity'
import type { PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'

export class GetMyGradesUseCase {
  constructor(private readonly gradeRepo: IGradeRepository) {}

  async execute(
    studentId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<GradeWithDetails>> {
    return this.gradeRepo.findByStudentId(studentId, params)
  }
}

import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'
import type { CourseWithLecturer, CourseWithStatus } from '@/domain/entities/course.entity'
import type { UserRole } from '@/domain/entities/user.entity'

export interface ListCoursesInput {
  page: number
  limit: number
  role: UserRole
  userId: string
}

export class ListCoursesUseCase {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(
    input: ListCoursesInput,
  ): Promise<PaginatedResult<CourseWithLecturer | CourseWithStatus>> {
    const params: PaginationParams = { page: input.page, limit: input.limit }

    if (input.role === 'STUDENT') {
      return this.courseRepo.findAllWithEnrollmentStatus(params, input.userId)
    }

    if (input.role === 'LECTURER') {
      return this.courseRepo.findByLecturerId(input.userId, params)
    }

    return this.courseRepo.findAll(params)
  }
}

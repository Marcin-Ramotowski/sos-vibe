import type { ICourseRepository, CreateCourseData } from '@/domain/repositories/ICourseRepository'
import type { Course } from '@/domain/entities/course.entity'

export class CreateCourseUseCase {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(data: CreateCourseData): Promise<Course> {
    return this.courseRepo.create(data)
  }
}

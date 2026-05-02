import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { CourseWithLecturer } from '@/domain/entities/course.entity'
import { NotFoundError } from '@/domain/errors'

export class GetCourseUseCase {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(courseId: string): Promise<CourseWithLecturer> {
    const course = await this.courseRepo.findById(courseId)
    if (!course) throw new NotFoundError('Kurs')
    return course
  }
}

import type { ICourseRepository, UpdateCourseData } from '@/domain/repositories/ICourseRepository'
import type { CourseWithLecturer } from '@/domain/entities/course.entity'
import { NotFoundError } from '@/domain/errors'

export class UpdateCourseUseCase {
  constructor(private readonly courseRepo: ICourseRepository) {}

  async execute(courseId: string, data: UpdateCourseData): Promise<CourseWithLecturer> {
    const existing = await this.courseRepo.findById(courseId)
    if (!existing) throw new NotFoundError('Kurs')
    return this.courseRepo.update(courseId, data)
  }
}

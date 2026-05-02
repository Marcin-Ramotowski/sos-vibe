import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { CourseWithLecturer } from '@/domain/entities/course.entity'
import { NotFoundError, ValidationError } from '@/domain/errors'

export interface AssignLecturerInput {
  courseId: string
  lecturerId: string
}

export class AssignLecturerUseCase {
  constructor(
    private readonly courseRepo: ICourseRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(input: AssignLecturerInput): Promise<CourseWithLecturer> {
    const course = await this.courseRepo.findById(input.courseId)
    if (!course) throw new NotFoundError('Kurs')

    const lecturer = await this.userRepo.findById(input.lecturerId)
    if (!lecturer) throw new NotFoundError('Prowadzący')
    if (lecturer.role !== 'LECTURER' && lecturer.role !== 'ADMIN') {
      throw new ValidationError('Użytkownik musi być prowadzącym')
    }

    return this.courseRepo.assignLecturer(input.courseId, input.lecturerId)
  }
}

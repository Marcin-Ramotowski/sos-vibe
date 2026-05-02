import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { Enrollment } from '@/domain/entities/enrollment.entity'
import { NotFoundError } from '@/domain/errors'

export interface EnrollStudentInput {
  studentId: string
  courseId: string
}

export class EnrollStudentUseCase {
  constructor(
    private readonly enrollmentRepo: IEnrollmentRepository,
    private readonly courseRepo: ICourseRepository,
  ) {}

  async execute(input: EnrollStudentInput): Promise<Enrollment> {
    const course = await this.courseRepo.findById(input.courseId)
    if (!course) throw new NotFoundError('Kurs')

    // Atomic enrollment - handles race conditions and already enrolled
    return this.enrollmentRepo.enrollAtomic(input.studentId, input.courseId)
  }
}

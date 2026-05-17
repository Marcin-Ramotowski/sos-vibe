import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository'
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
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(input: EnrollStudentInput): Promise<Enrollment> {
    const course = await this.courseRepo.findById(input.courseId)
    if (!course) throw new NotFoundError('Kurs')

    // Atomic enrollment - handles race conditions and already enrolled
    const enrollment = await this.enrollmentRepo.enrollAtomic(input.studentId, input.courseId)
    if (course.lecturerId) {
      try {
        await this.notificationRepo.create({
          userId: course.lecturerId,
          type: 'STUDENT_ENROLLED',
          payload: { courseId: input.courseId, studentId: input.studentId },
        })
      } catch { /* silently ignored */ }
    }
    return enrollment
  }
}

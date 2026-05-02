import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import { NotFoundError, GradeExistsError, ForbiddenError } from '@/domain/errors'

export interface UnenrollStudentInput {
  studentId: string
  courseId: string
  requestingUserId: string
  requestingUserRole: string
}

export class UnenrollStudentUseCase {
  constructor(private readonly enrollmentRepo: IEnrollmentRepository) {}

  async execute(input: UnenrollStudentInput): Promise<void> {
    const enrollment = await this.enrollmentRepo.findByStudentAndCourse(
      input.studentId,
      input.courseId,
    )
    if (!enrollment) throw new NotFoundError('Zapis')

    // Students can only unenroll themselves; admins can unenroll anyone
    if (
      input.requestingUserRole === 'STUDENT' &&
      enrollment.studentId !== input.requestingUserId
    ) {
      throw new ForbiddenError()
    }

    const hasGrade = await this.enrollmentRepo.hasGrade(enrollment.id)
    if (hasGrade) throw new GradeExistsError()

    await this.enrollmentRepo.unenroll(enrollment.id)
  }
}

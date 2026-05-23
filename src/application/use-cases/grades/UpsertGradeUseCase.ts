import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { Grade } from '@/domain/entities/grade.entity'
import { isValidGrade } from '@/domain/entities/grade.entity'
import { NotFoundError, ForbiddenError, ValidationError } from '@/domain/errors'

export interface UpsertGradeInput {
  courseId: string
  studentId: string
  value: number
  lecturerId: string
}

export class UpsertGradeUseCase {
  constructor(
    private readonly gradeRepo: IGradeRepository,
    private readonly courseRepo: ICourseRepository,
    private readonly enrollmentRepo: IEnrollmentRepository,
  ) {}

  async execute(input: UpsertGradeInput): Promise<Grade> {
    if (!isValidGrade(input.value)) {
      throw new ValidationError(
        `Nieprawidłowa ocena: ${input.value}. Dozwolone: 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5`,
      )
    }

    const course = await this.courseRepo.findById(input.courseId)
    if (!course) throw new NotFoundError('Kurs')

    if (course.lecturerId !== input.lecturerId) {
      throw new ForbiddenError('Nie jesteś prowadzącym tego kursu')
    }

    const enrollment = await this.enrollmentRepo.findByStudentAndCourse(
      input.studentId,
      input.courseId,
    )
    if (!enrollment) throw new NotFoundError('Zapis studenta na kurs')

    return this.gradeRepo.upsertWithAudit({
      enrollmentId: enrollment.id,
      value: input.value,
      gradedById: input.lecturerId,
    })
  }
}

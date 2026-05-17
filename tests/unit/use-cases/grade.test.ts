import { describe, it, expect, vi } from 'vitest'
import { UpsertGradeUseCase } from '@/application/use-cases/grades/UpsertGradeUseCase'
import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository'
import { NotFoundError, ForbiddenError, ValidationError } from '@/domain/errors'

const makeGradeRepo = (overrides: Partial<IGradeRepository> = {}): IGradeRepository => ({
  findByEnrollmentId: vi.fn(),
  findByStudentId: vi.fn(),
  findByCourseId: vi.fn(),
  upsertWithAudit: vi.fn(),
  ...overrides,
})

const makeCourseRepo = (overrides: Partial<ICourseRepository> = {}): ICourseRepository => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  findAllWithEnrollmentStatus: vi.fn(),
  findByLecturerId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  assignLecturer: vi.fn(),
  getStudentList: vi.fn(),
  ...overrides,
})

const makeEnrollmentRepo = (overrides: Partial<IEnrollmentRepository> = {}): IEnrollmentRepository => ({
  findById: vi.fn(),
  findByStudentAndCourse: vi.fn(),
  findByStudentId: vi.fn(),
  enrollAtomic: vi.fn(),
  unenroll: vi.fn(),
  hasGrade: vi.fn(),
  ...overrides,
})

const makeNotificationRepo = (overrides: Partial<INotificationRepository> = {}): INotificationRepository => ({
  create: vi.fn().mockResolvedValue({}),
  findUnreadByUserId: vi.fn(),
  markAsRead: vi.fn(),
  ...overrides,
})

const mockCourse = {
  id: 'course-1',
  name: 'Test Course',
  description: null,
  capacity: 30,
  enrolledCount: 5,
  lecturerId: 'lecturer-1',
  startDate: null,
  endDate: null,
  enrollmentDeadline: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lecturer: null,
}

const mockEnrollment = {
  id: 'enrollment-1',
  studentId: 'student-1',
  courseId: 'course-1',
  enrolledAt: new Date(),
}

const mockGrade = {
  id: 'grade-1',
  enrollmentId: 'enrollment-1',
  value: 4.0,
  gradedById: 'lecturer-1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('UpsertGradeUseCase', () => {
  it('should upsert grade successfully with valid value', async () => {
    const gradeRepo = makeGradeRepo({ upsertWithAudit: vi.fn().mockResolvedValue(mockGrade) })
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
    })

    const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo, makeNotificationRepo())
    const result = await useCase.execute({
      courseId: 'course-1',
      studentId: 'student-1',
      value: 4.0,
      lecturerId: 'lecturer-1',
    })

    expect(result).toEqual(mockGrade)
    expect(gradeRepo.upsertWithAudit).toHaveBeenCalledWith({
      enrollmentId: 'enrollment-1',
      value: 4.0,
      gradedById: 'lecturer-1',
    })
  })

  it('should throw ValidationError for invalid grade 2.5', async () => {
    const useCase = new UpsertGradeUseCase(makeGradeRepo(), makeCourseRepo(), makeEnrollmentRepo(), makeNotificationRepo())
    await expect(
      useCase.execute({
        courseId: 'course-1',
        studentId: 'student-1',
        value: 2.5,
        lecturerId: 'lecturer-1',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('should throw ValidationError for grade 1.0', async () => {
    const useCase = new UpsertGradeUseCase(makeGradeRepo(), makeCourseRepo(), makeEnrollmentRepo(), makeNotificationRepo())
    await expect(
      useCase.execute({
        courseId: 'course-1',
        studentId: 'student-1',
        value: 1.0,
        lecturerId: 'lecturer-1',
      }),
    ).rejects.toThrow(ValidationError)
  })

  it('should accept all valid Polish grades', async () => {
    const validGrades = [2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5]
    for (const value of validGrades) {
      const gradeRepo = makeGradeRepo({
        upsertWithAudit: vi.fn().mockResolvedValue({ ...mockGrade, value }),
      })
      const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
      const enrollmentRepo = makeEnrollmentRepo({
        findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
      })
      const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo, makeNotificationRepo())

      const result = await useCase.execute({
        courseId: 'course-1',
        studentId: 'student-1',
        value,
        lecturerId: 'lecturer-1',
      })

      expect(result.value).toBe(value)
    }
  })

  it('should throw NotFoundError when course does not exist', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpsertGradeUseCase(makeGradeRepo(), courseRepo, makeEnrollmentRepo(), makeNotificationRepo())

    await expect(
      useCase.execute({
        courseId: 'nonexistent',
        studentId: 'student-1',
        value: 4.0,
        lecturerId: 'lecturer-1',
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('should throw ForbiddenError when lecturer is not the course lecturer', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const useCase = new UpsertGradeUseCase(makeGradeRepo(), courseRepo, makeEnrollmentRepo(), makeNotificationRepo())

    await expect(
      useCase.execute({
        courseId: 'course-1',
        studentId: 'student-1',
        value: 4.0,
        lecturerId: 'wrong-lecturer',
      }),
    ).rejects.toThrow(ForbiddenError)
  })

  it('should throw NotFoundError when student is not enrolled', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(null),
    })
    const useCase = new UpsertGradeUseCase(makeGradeRepo(), courseRepo, enrollmentRepo, makeNotificationRepo())

    await expect(
      useCase.execute({
        courseId: 'course-1',
        studentId: 'student-1',
        value: 4.0,
        lecturerId: 'lecturer-1',
      }),
    ).rejects.toThrow(NotFoundError)
  })
})

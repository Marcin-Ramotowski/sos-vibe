import { describe, it, expect, vi } from 'vitest'
import { EnrollStudentUseCase } from '@/application/use-cases/enrollments/EnrollStudentUseCase'
import { UnenrollStudentUseCase } from '@/application/use-cases/enrollments/UnenrollStudentUseCase'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import { CourseFullError, AlreadyEnrolledError, GradeExistsError, NotFoundError } from '@/domain/errors'

const makeEnrollmentRepo = (overrides: Partial<IEnrollmentRepository> = {}): IEnrollmentRepository => ({
  findById: vi.fn(),
  findByStudentAndCourse: vi.fn(),
  findByStudentId: vi.fn(),
  enrollAtomic: vi.fn(),
  unenroll: vi.fn(),
  hasGrade: vi.fn(),
  ...overrides,
})

const makeCourseRepo = (overrides: Partial<ICourseRepository> = {}): ICourseRepository => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  findAllWithEnrollmentStatus: vi.fn(),
  findByLecturerId: vi.fn(),
  create: vi.fn(),
  assignLecturer: vi.fn(),
  getStudentList: vi.fn(),
  ...overrides,
})

const mockCourse = {
  id: 'course-1',
  name: 'Test Course',
  description: null,
  capacity: 30,
  enrolledCount: 5,
  lecturerId: 'lecturer-1',
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

describe('EnrollStudentUseCase', () => {
  it('should enroll student successfully', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockResolvedValue(mockEnrollment),
    })
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo)

    const result = await useCase.execute({ studentId: 'student-1', courseId: 'course-1' })

    expect(result).toEqual(mockEnrollment)
    expect(enrollmentRepo.enrollAtomic).toHaveBeenCalledWith('student-1', 'course-1')
  })

  it('should throw NotFoundError when course does not exist', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(null) })
    const enrollmentRepo = makeEnrollmentRepo()
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo)

    await expect(useCase.execute({ studentId: 'student-1', courseId: 'nonexistent' })).rejects.toThrow(
      NotFoundError,
    )
  })

  it('should propagate CourseFullError from repository', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockRejectedValue(new CourseFullError()),
    })
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo)

    await expect(useCase.execute({ studentId: 'student-1', courseId: 'course-1' })).rejects.toThrow(
      CourseFullError,
    )
  })

  it('should propagate AlreadyEnrolledError from repository', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockRejectedValue(new AlreadyEnrolledError()),
    })
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo)

    await expect(useCase.execute({ studentId: 'student-1', courseId: 'course-1' })).rejects.toThrow(
      AlreadyEnrolledError,
    )
  })
})

describe('UnenrollStudentUseCase', () => {
  it('should unenroll student successfully', async () => {
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
      hasGrade: vi.fn().mockResolvedValue(false),
      unenroll: vi.fn().mockResolvedValue(undefined),
    })
    const useCase = new UnenrollStudentUseCase(enrollmentRepo)

    await useCase.execute({
      studentId: 'student-1',
      courseId: 'course-1',
      requestingUserId: 'student-1',
      requestingUserRole: 'STUDENT',
    })

    expect(enrollmentRepo.unenroll).toHaveBeenCalledWith('enrollment-1')
  })

  it('should throw NotFoundError if enrollment does not exist', async () => {
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(null),
    })
    const useCase = new UnenrollStudentUseCase(enrollmentRepo)

    await expect(
      useCase.execute({
        studentId: 'student-1',
        courseId: 'course-1',
        requestingUserId: 'student-1',
        requestingUserRole: 'STUDENT',
      }),
    ).rejects.toThrow(NotFoundError)
  })

  it('should throw GradeExistsError if grade exists', async () => {
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
      hasGrade: vi.fn().mockResolvedValue(true),
    })
    const useCase = new UnenrollStudentUseCase(enrollmentRepo)

    await expect(
      useCase.execute({
        studentId: 'student-1',
        courseId: 'course-1',
        requestingUserId: 'student-1',
        requestingUserRole: 'STUDENT',
      }),
    ).rejects.toThrow(GradeExistsError)
  })

  it('should throw ForbiddenError if student tries to unenroll another student', async () => {
    const differentStudentEnrollment = { ...mockEnrollment, studentId: 'student-2' }
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(differentStudentEnrollment),
      hasGrade: vi.fn().mockResolvedValue(false),
    })
    const useCase = new UnenrollStudentUseCase(enrollmentRepo)

    await expect(
      useCase.execute({
        studentId: 'student-2',
        courseId: 'course-1',
        requestingUserId: 'student-1',
        requestingUserRole: 'STUDENT',
      }),
    ).rejects.toThrow()
  })

  it('should allow admin to unenroll any student', async () => {
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
      hasGrade: vi.fn().mockResolvedValue(false),
      unenroll: vi.fn().mockResolvedValue(undefined),
    })
    const useCase = new UnenrollStudentUseCase(enrollmentRepo)

    await useCase.execute({
      studentId: 'student-1',
      courseId: 'course-1',
      requestingUserId: 'admin-1',
      requestingUserRole: 'ADMIN',
    })

    expect(enrollmentRepo.unenroll).toHaveBeenCalledWith('enrollment-1')
  })
})

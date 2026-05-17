import { describe, it, expect, vi, afterEach } from 'vitest'
import { EnrollStudentUseCase } from '@/application/use-cases/enrollments/EnrollStudentUseCase'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository'
import { EnrollmentClosedError } from '@/domain/errors'

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
  create: vi.fn(),
  findUnreadByUserId: vi.fn(),
  markAsRead: vi.fn(),
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

const baseCourse = {
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

afterEach(() => {
  vi.useRealTimers()
})

describe('EnrollStudentUseCase — enrollment deadline guard', () => {
  it('[AC-010-1] throws EnrollmentClosedError when enrollmentDeadline has passed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01'))

    const course = { ...baseCourse, enrollmentDeadline: new Date('2026-05-31') }
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(course) })
    const enrollmentRepo = makeEnrollmentRepo()
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo, makeNotificationRepo())

    await expect(
      useCase.execute({ studentId: 'student-1', courseId: 'course-1' }),
    ).rejects.toThrow(EnrollmentClosedError)

    expect(enrollmentRepo.enrollAtomic).not.toHaveBeenCalled()
  })

  it('[AC-010-2] allows enrollment when enrollmentDeadline is null', async () => {
    const course = { ...baseCourse, enrollmentDeadline: null }
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(course) })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockResolvedValue(mockEnrollment),
    })
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo, makeNotificationRepo())

    const result = await useCase.execute({ studentId: 'student-1', courseId: 'course-1' })

    expect(result).toEqual(mockEnrollment)
    expect(enrollmentRepo.enrollAtomic).toHaveBeenCalledWith('student-1', 'course-1')
  })

  it('allows enrollment when enrollmentDeadline is in the future', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-01'))

    const course = { ...baseCourse, enrollmentDeadline: new Date('2026-05-31') }
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(course) })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockResolvedValue(mockEnrollment),
    })
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo, makeNotificationRepo())

    const result = await useCase.execute({ studentId: 'student-1', courseId: 'course-1' })

    expect(result).toEqual(mockEnrollment)
  })
})

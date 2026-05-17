import { describe, it, expect, vi } from 'vitest'
import { GetNotificationsUseCase } from '@/application/use-cases/notifications/GetNotificationsUseCase'
import { MarkNotificationReadUseCase } from '@/application/use-cases/notifications/MarkNotificationReadUseCase'
import { UpsertGradeUseCase } from '@/application/use-cases/grades/UpsertGradeUseCase'
import { EnrollStudentUseCase } from '@/application/use-cases/enrollments/EnrollStudentUseCase'
import type { INotificationRepository } from '@/domain/repositories/INotificationRepository'
import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'

const makeINotificationRepository = (
  overrides: Partial<INotificationRepository> = {},
): INotificationRepository => ({
  create: vi.fn(),
  findUnreadByUserId: vi.fn(),
  markAsRead: vi.fn(),
  ...overrides,
})

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

const mockNotification = {
  id: 'n1',
  userId: 'user-1',
  type: 'GRADE_ASSIGNED' as const,
  payload: { courseId: 'c1', gradeValue: 4.5 },
  readAt: null,
  createdAt: new Date(),
}

const mockCourse = {
  id: 'course-1',
  name: 'Test Course',
  description: null,
  capacity: 30,
  enrolledCount: 5,
  lecturerId: 'l1',
  createdAt: new Date(),
  updatedAt: new Date(),
  lecturer: null,
}

const mockEnrollment = {
  id: 'enrollment-1',
  studentId: 's1',
  courseId: 'c1',
  enrolledAt: new Date(),
}

const mockGrade = {
  id: 'grade-1',
  enrollmentId: 'enrollment-1',
  value: 4.5,
  gradedById: 'l1',
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('GetNotificationsUseCase', () => {
  it('delegates to findUnreadByUserId', async () => {
    const notifications = [mockNotification]
    const notifRepo = makeINotificationRepository({
      findUnreadByUserId: vi.fn().mockResolvedValue(notifications),
    })
    const result = await new GetNotificationsUseCase(notifRepo).execute('user-id')
    expect(result).toBe(notifications)
    expect(notifRepo.findUnreadByUserId).toHaveBeenCalledWith('user-id')
  })
})

describe('MarkNotificationReadUseCase', () => {
  it('delegates to markAsRead', async () => {
    const updated = { ...mockNotification, readAt: new Date() }
    const notifRepo = makeINotificationRepository({
      markAsRead: vi.fn().mockResolvedValue(updated),
    })
    const result = await new MarkNotificationReadUseCase(notifRepo).execute('n1', 'user-id')
    expect(result).toBe(updated)
    expect(notifRepo.markAsRead).toHaveBeenCalledWith('n1', 'user-id')
  })
})

describe('UpsertGradeUseCase — notifications', () => {
  it('creates GRADE_ASSIGNED notification after successful upsert', async () => {
    const notifRepo = makeINotificationRepository({
      create: vi.fn().mockResolvedValue({}),
    })
    const gradeRepo = makeGradeRepo({
      upsertWithAudit: vi.fn().mockResolvedValue(mockGrade),
    })
    const courseRepo = makeCourseRepo({
      findById: vi.fn().mockResolvedValue(mockCourse),
    })
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
    })

    const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo, notifRepo)
    await useCase.execute({ studentId: 's1', courseId: 'c1', value: 4.5, lecturerId: 'l1' })

    expect(notifRepo.create).toHaveBeenCalledWith({
      userId: 's1',
      type: 'GRADE_ASSIGNED',
      payload: { courseId: 'c1', gradeValue: 4.5 },
    })
  })

  it('does not propagate notifRepo.create error (non-critical)', async () => {
    const notifRepo = makeINotificationRepository({
      create: vi.fn().mockRejectedValue(new Error('DB error')),
    })
    const gradeRepo = makeGradeRepo({
      upsertWithAudit: vi.fn().mockResolvedValue(mockGrade),
    })
    const courseRepo = makeCourseRepo({
      findById: vi.fn().mockResolvedValue(mockCourse),
    })
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentAndCourse: vi.fn().mockResolvedValue(mockEnrollment),
    })

    const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo, notifRepo)
    await expect(
      useCase.execute({ studentId: 's1', courseId: 'c1', value: 4.5, lecturerId: 'l1' }),
    ).resolves.toBeDefined()
  })
})

describe('EnrollStudentUseCase — notifications', () => {
  it('creates STUDENT_ENROLLED notification when course has a lecturer', async () => {
    const notifRepo = makeINotificationRepository({
      create: vi.fn().mockResolvedValue({}),
    })
    const courseRepo = makeCourseRepo({
      findById: vi.fn().mockResolvedValue(mockCourse),
    })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockResolvedValue(mockEnrollment),
    })

    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo, notifRepo)
    await useCase.execute({ studentId: 's1', courseId: 'c1' })

    expect(notifRepo.create).toHaveBeenCalledWith({
      userId: 'l1',
      type: 'STUDENT_ENROLLED',
      payload: { courseId: 'c1', studentId: 's1' },
    })
  })

  it('does not create notification when course has no lecturer', async () => {
    const notifRepo = makeINotificationRepository({
      create: vi.fn().mockResolvedValue({}),
    })
    const courseRepo = makeCourseRepo({
      findById: vi.fn().mockResolvedValue({ ...mockCourse, lecturerId: null }),
    })
    const enrollmentRepo = makeEnrollmentRepo({
      enrollAtomic: vi.fn().mockResolvedValue(mockEnrollment),
    })

    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo, notifRepo)
    await useCase.execute({ studentId: 's1', courseId: 'c1' })

    expect(notifRepo.create).not.toHaveBeenCalled()
  })
})

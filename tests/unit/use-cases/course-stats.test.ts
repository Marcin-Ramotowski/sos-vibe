import { describe, it, expect, vi } from 'vitest'
import { GetCourseStatsUseCase, computeStats } from '@/application/use-cases/grades/GetCourseStatsUseCase'
import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'

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
  lecturer: {
    id: 'lecturer-1',
    email: 'l@test.pl',
    role: 'LECTURER' as const,
    firstName: 'Jan',
    lastName: 'K',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

describe('GetCourseStatsUseCase', () => {
  it('[AC-002-1] oblicza poprawną średnią dla zestawu ocen', async () => {
    const grades = [3.0, 4.0, 5.0]
    const gradeRepo = makeGradeRepo({ findByCourseId: vi.fn().mockResolvedValue(grades) })
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const useCase = new GetCourseStatsUseCase(gradeRepo, courseRepo)

    const result = await useCase.execute({ courseId: 'course-1', userId: 'lecturer-1', userRole: 'LECTURER' })

    expect(result.mean).toBeCloseTo(4.0)
  })

  it('[AC-002-2] oblicza poprawną medianę dla zestawu ocen', async () => {
    const gradeRepo = makeGradeRepo({ findByCourseId: vi.fn().mockResolvedValue([3.0, 4.0, 5.0]) })
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const useCase = new GetCourseStatsUseCase(gradeRepo, courseRepo)

    const odd = await useCase.execute({ courseId: 'course-1', userId: 'lecturer-1', userRole: 'LECTURER' })
    expect(odd.median).toBe(4.0)

    gradeRepo.findByCourseId = vi.fn().mockResolvedValue([3.0, 4.0, 4.5, 5.0])
    const even = await useCase.execute({ courseId: 'course-1', userId: 'lecturer-1', userRole: 'LECTURER' })
    expect(even.median).toBeCloseTo(4.25)
  })

  it('[AC-002-3] zwraca poprawny rozkład ocen (liczba wystąpień per wartość)', async () => {
    const grades = [2.0, 3.0, 3.0, 4.0, 5.0]
    const gradeRepo = makeGradeRepo({ findByCourseId: vi.fn().mockResolvedValue(grades) })
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const useCase = new GetCourseStatsUseCase(gradeRepo, courseRepo)

    const result = await useCase.execute({ courseId: 'course-1', userId: 'lecturer-1', userRole: 'LECTURER' })

    expect(result.distribution['2']).toBe(1)
    expect(result.distribution['3']).toBe(2)
    expect(result.distribution['4']).toBe(1)
    expect(result.distribution['5']).toBe(1)
    expect(result.distribution['3.5']).toBe(0)
    expect(result.distribution['4.5']).toBe(0)
  })

  it('[AC-002-4] oblicza poprawny procent zaliczonych', async () => {
    const grades = [2.0, 3.0, 4.0, 5.0]
    const gradeRepo = makeGradeRepo({ findByCourseId: vi.fn().mockResolvedValue(grades) })
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const useCase = new GetCourseStatsUseCase(gradeRepo, courseRepo)

    const result = await useCase.execute({ courseId: 'course-1', userId: 'lecturer-1', userRole: 'LECTURER' })

    expect(result.passRate).toBeCloseTo(75)
  })
})

describe('computeStats (edge cases)', () => {
  it('zwraca zera gdy brak ocen', () => {
    const result = computeStats([])
    expect(result.mean).toBe(0)
    expect(result.median).toBe(0)
    expect(result.passRate).toBe(0)
  })
})

import { describe, it, expect, vi } from 'vitest'
import { AssignLecturerUseCase } from '@/application/use-cases/courses/AssignLecturerUseCase'
import { CreateCourseUseCase } from '@/application/use-cases/courses/CreateCourseUseCase'
import { GetCourseUseCase } from '@/application/use-cases/courses/GetCourseUseCase'
import { ListCoursesUseCase } from '@/application/use-cases/courses/ListCoursesUseCase'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import { NotFoundError, ValidationError } from '@/domain/errors'

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

const makeUserRepo = (overrides: Partial<IUserRepository> = {}): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  updateRole: vi.fn(),
  ...overrides,
})

const mockCourse = {
  id: 'course-1',
  name: 'Test Course',
  description: null,
  capacity: 30,
  enrolledCount: 0,
  lecturerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lecturer: null,
}

const mockLecturer = {
  id: 'lecturer-1',
  email: 'lecturer@test.pl',
  role: 'LECTURER' as const,
  firstName: 'Jan',
  lastName: 'Kowalski',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPaginated = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
}

describe('AssignLecturerUseCase', () => {
  it('should assign lecturer when course and LECTURER user exist', async () => {
    const updatedCourse = { ...mockCourse, lecturerId: 'lecturer-1', lecturer: mockLecturer }
    const courseRepo = makeCourseRepo({
      findById: vi.fn().mockResolvedValue(mockCourse),
      assignLecturer: vi.fn().mockResolvedValue(updatedCourse),
    })
    const userRepo = makeUserRepo({ findById: vi.fn().mockResolvedValue(mockLecturer) })
    const useCase = new AssignLecturerUseCase(courseRepo, userRepo)

    const result = await useCase.execute({ courseId: 'course-1', lecturerId: 'lecturer-1' })

    expect(result.lecturerId).toBe('lecturer-1')
    expect(courseRepo.assignLecturer).toHaveBeenCalledWith('course-1', 'lecturer-1')
  })

  it('should allow ADMIN role as lecturer', async () => {
    const admin = { ...mockLecturer, role: 'ADMIN' as const }
    const courseRepo = makeCourseRepo({
      findById: vi.fn().mockResolvedValue(mockCourse),
      assignLecturer: vi.fn().mockResolvedValue(mockCourse),
    })
    const userRepo = makeUserRepo({ findById: vi.fn().mockResolvedValue(admin) })
    const useCase = new AssignLecturerUseCase(courseRepo, userRepo)

    await useCase.execute({ courseId: 'course-1', lecturerId: 'admin-1' })

    expect(courseRepo.assignLecturer).toHaveBeenCalled()
  })

  it('should throw NotFoundError when course does not exist', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new AssignLecturerUseCase(courseRepo, makeUserRepo())

    await expect(useCase.execute({ courseId: 'bad-id', lecturerId: 'lecturer-1' })).rejects.toThrow(
      NotFoundError,
    )
  })

  it('should throw NotFoundError when lecturer user does not exist', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const userRepo = makeUserRepo({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new AssignLecturerUseCase(courseRepo, userRepo)

    await expect(useCase.execute({ courseId: 'course-1', lecturerId: 'bad-id' })).rejects.toThrow(
      NotFoundError,
    )
  })

  it('should throw ValidationError when user is STUDENT', async () => {
    const student = { ...mockLecturer, role: 'STUDENT' as const }
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const userRepo = makeUserRepo({ findById: vi.fn().mockResolvedValue(student) })
    const useCase = new AssignLecturerUseCase(courseRepo, userRepo)

    await expect(
      useCase.execute({ courseId: 'course-1', lecturerId: 'student-1' }),
    ).rejects.toThrow(ValidationError)
  })
})

describe('CreateCourseUseCase', () => {
  it('should create course and return it', async () => {
    const created = { ...mockCourse, name: 'New Course', capacity: 25 }
    const courseRepo = makeCourseRepo({ create: vi.fn().mockResolvedValue(created) })
    const useCase = new CreateCourseUseCase(courseRepo)

    const result = await useCase.execute({ name: 'New Course', capacity: 25 })

    expect(result.name).toBe('New Course')
    expect(courseRepo.create).toHaveBeenCalledWith({ name: 'New Course', capacity: 25 })
  })
})

describe('GetCourseUseCase', () => {
  it('should return course when found', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(mockCourse) })
    const useCase = new GetCourseUseCase(courseRepo)

    const result = await useCase.execute('course-1')

    expect(result.id).toBe('course-1')
  })

  it('should throw NotFoundError when course not found', async () => {
    const courseRepo = makeCourseRepo({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new GetCourseUseCase(courseRepo)

    await expect(useCase.execute('bad-id')).rejects.toThrow(NotFoundError)
  })
})

describe('ListCoursesUseCase', () => {
  const params = { page: 1, limit: 20, userId: 'user-1' }

  it('should call findAllWithEnrollmentStatus for STUDENT role', async () => {
    const courseRepo = makeCourseRepo({
      findAllWithEnrollmentStatus: vi.fn().mockResolvedValue(mockPaginated),
    })
    const useCase = new ListCoursesUseCase(courseRepo)

    await useCase.execute({ ...params, role: 'STUDENT' })

    expect(courseRepo.findAllWithEnrollmentStatus).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      'user-1',
    )
    expect(courseRepo.findAll).not.toHaveBeenCalled()
  })

  it('should call findByLecturerId for LECTURER role', async () => {
    const courseRepo = makeCourseRepo({
      findByLecturerId: vi.fn().mockResolvedValue(mockPaginated),
    })
    const useCase = new ListCoursesUseCase(courseRepo)

    await useCase.execute({ ...params, role: 'LECTURER' })

    expect(courseRepo.findByLecturerId).toHaveBeenCalledWith('user-1', { page: 1, limit: 20 })
  })

  it('should call findAll for ADMIN role', async () => {
    const courseRepo = makeCourseRepo({ findAll: vi.fn().mockResolvedValue(mockPaginated) })
    const useCase = new ListCoursesUseCase(courseRepo)

    await useCase.execute({ ...params, role: 'ADMIN' })

    expect(courseRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 })
  })
})

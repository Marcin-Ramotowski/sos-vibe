import { describe, it, expect, vi } from 'vitest'
import { ListUsersUseCase } from '@/application/use-cases/users/ListUsersUseCase'
import { UpdateUserRoleUseCase } from '@/application/use-cases/users/UpdateUserRoleUseCase'
import { GetMyEnrollmentsUseCase } from '@/application/use-cases/enrollments/GetMyEnrollmentsUseCase'
import { GetMyGradesUseCase } from '@/application/use-cases/grades/GetMyGradesUseCase'
import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import { NotFoundError } from '@/domain/errors'

const makeUserRepo = (overrides: Partial<IUserRepository> = {}): IUserRepository => ({
  findById: vi.fn(),
  findByEmail: vi.fn(),
  findAll: vi.fn(),
  updateRole: vi.fn(),
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

const makeGradeRepo = (overrides: Partial<IGradeRepository> = {}): IGradeRepository => ({
  findByEnrollmentId: vi.fn(),
  findByStudentId: vi.fn(),
  findByCourseId: vi.fn(),
  upsertWithAudit: vi.fn(),
  ...overrides,
})

const mockUser = {
  id: 'user-1',
  email: 'user@test.pl',
  role: 'STUDENT' as const,
  firstName: 'Anna',
  lastName: 'Nowak',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPaginated = {
  data: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
}

describe('ListUsersUseCase', () => {
  it('should list users from repository', async () => {
    const paginated = { ...mockPaginated, data: [mockUser], pagination: { ...mockPaginated.pagination, total: 1 } }
    const userRepo = makeUserRepo({ findAll: vi.fn().mockResolvedValue(paginated) })
    const useCase = new ListUsersUseCase(userRepo)

    const result = await useCase.execute({ page: 1, limit: 20 })

    expect(result.data).toHaveLength(1)
    expect(userRepo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 })
  })
})

describe('UpdateUserRoleUseCase', () => {
  it('should update user role when user exists', async () => {
    const updatedUser = { ...mockUser, role: 'LECTURER' as const }
    const userRepo = makeUserRepo({
      findById: vi.fn().mockResolvedValue(mockUser),
      updateRole: vi.fn().mockResolvedValue(updatedUser),
    })
    const useCase = new UpdateUserRoleUseCase(userRepo)

    const result = await useCase.execute({ userId: 'user-1', role: 'LECTURER' })

    expect(result.role).toBe('LECTURER')
    expect(userRepo.updateRole).toHaveBeenCalledWith('user-1', 'LECTURER')
  })

  it('should throw NotFoundError when user does not exist', async () => {
    const userRepo = makeUserRepo({ findById: vi.fn().mockResolvedValue(null) })
    const useCase = new UpdateUserRoleUseCase(userRepo)

    await expect(useCase.execute({ userId: 'bad-id', role: 'LECTURER' })).rejects.toThrow(
      NotFoundError,
    )
  })
})

describe('GetMyEnrollmentsUseCase', () => {
  it('should return student enrollments from repository', async () => {
    const enrollmentRepo = makeEnrollmentRepo({
      findByStudentId: vi.fn().mockResolvedValue(mockPaginated),
    })
    const useCase = new GetMyEnrollmentsUseCase(enrollmentRepo)

    await useCase.execute('student-1', { page: 1, limit: 20 })

    expect(enrollmentRepo.findByStudentId).toHaveBeenCalledWith('student-1', { page: 1, limit: 20 })
  })
})

describe('GetMyGradesUseCase', () => {
  it('should return student grades from repository', async () => {
    const gradeRepo = makeGradeRepo({
      findByStudentId: vi.fn().mockResolvedValue(mockPaginated),
    })
    const useCase = new GetMyGradesUseCase(gradeRepo)

    await useCase.execute('student-1', { page: 1, limit: 20 })

    expect(gradeRepo.findByStudentId).toHaveBeenCalledWith('student-1', { page: 1, limit: 20 })
  })
})

import type { User, UserWithPassword, UserRole } from '../entities/user.entity'

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<UserWithPassword | null>
  findAll(params: PaginationParams): Promise<PaginatedResult<User>>
  updateRole(id: string, role: UserRole): Promise<User>
}

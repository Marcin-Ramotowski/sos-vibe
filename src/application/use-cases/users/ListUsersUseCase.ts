import type { IUserRepository, PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'
import type { User } from '@/domain/entities/user.entity'

export class ListUsersUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(params: PaginationParams): Promise<PaginatedResult<User>> {
    return this.userRepo.findAll(params)
  }
}

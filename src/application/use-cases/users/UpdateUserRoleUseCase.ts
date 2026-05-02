import type { IUserRepository } from '@/domain/repositories/IUserRepository'
import type { User, UserRole } from '@/domain/entities/user.entity'
import { NotFoundError } from '@/domain/errors'

export interface UpdateUserRoleInput {
  userId: string
  role: UserRole
}

export class UpdateUserRoleUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<User> {
    const user = await this.userRepo.findById(input.userId)
    if (!user) throw new NotFoundError('Użytkownik')
    return this.userRepo.updateRole(input.userId, input.role)
  }
}

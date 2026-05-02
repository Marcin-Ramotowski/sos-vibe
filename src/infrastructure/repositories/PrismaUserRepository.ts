import type { IUserRepository, PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'
import type { User, UserWithPassword, UserRole } from '@/domain/entities/user.entity'
import prisma from '@/infrastructure/database/prisma'

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return this.mapUser(user)
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return {
      ...this.mapUser(user),
      passwordHash: user.passwordHash,
    }
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<User>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
    ])

    return {
      data: users.map(this.mapUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateRole(id: string, role: UserRole): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: { role },
    })
    return this.mapUser(user)
  }

  private mapUser(user: {
    id: string
    email: string
    role: string
    firstName: string
    lastName: string
    createdAt: Date
    updatedAt: Date
  }): User {
    return {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}

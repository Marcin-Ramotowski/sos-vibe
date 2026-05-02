import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository'
import { ListUsersUseCase } from '@/application/use-cases/users/ListUsersUseCase'
import { parsePagination } from '@/presentation/api/pagination'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'ADMIN') throw new ForbiddenError()

    const params = parsePagination(request.nextUrl.searchParams)
    const userRepo = new PrismaUserRepository()
    const useCase = new ListUsersUseCase(userRepo)
    const result = await useCase.execute(params)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

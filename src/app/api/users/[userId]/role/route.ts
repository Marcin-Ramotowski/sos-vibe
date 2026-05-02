import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository'
import { UpdateUserRoleUseCase } from '@/application/use-cases/users/UpdateUserRoleUseCase'
import { updateRoleSchema } from '@/presentation/api/schemas/grade.schema'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'ADMIN') throw new ForbiddenError()

    const { userId } = await params
    const body = await request.json()
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const userRepo = new PrismaUserRepository()
    const useCase = new UpdateUserRoleUseCase(userRepo)
    const user = await useCase.execute({ userId, role: parsed.data.role as UserRole })

    return NextResponse.json(user)
  } catch (error) {
    return handleApiError(error)
  }
}

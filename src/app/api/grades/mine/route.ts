import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaGradeRepository } from '@/infrastructure/repositories/PrismaGradeRepository'
import { GetMyGradesUseCase } from '@/application/use-cases/grades/GetMyGradesUseCase'
import { parsePagination } from '@/presentation/api/pagination'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'STUDENT') throw new ForbiddenError()

    const params = parsePagination(request.nextUrl.searchParams)
    const gradeRepo = new PrismaGradeRepository()
    const useCase = new GetMyGradesUseCase(gradeRepo)
    const result = await useCase.execute(userId, params)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

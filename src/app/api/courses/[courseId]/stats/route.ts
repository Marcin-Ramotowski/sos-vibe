import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaGradeRepository } from '@/infrastructure/repositories/PrismaGradeRepository'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { GetCourseStatsUseCase } from '@/application/use-cases/grades/GetCourseStatsUseCase'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole

    if (userRole !== 'LECTURER' && userRole !== 'ADMIN') throw new ForbiddenError()

    const { courseId } = await params

    const useCase = new GetCourseStatsUseCase(
      new PrismaGradeRepository(),
      new PrismaCourseRepository(),
    )

    const result = await useCase.execute({ courseId, userId, userRole })
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

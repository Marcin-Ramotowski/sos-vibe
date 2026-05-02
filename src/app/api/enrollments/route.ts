import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaEnrollmentRepository } from '@/infrastructure/repositories/PrismaEnrollmentRepository'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { EnrollStudentUseCase } from '@/application/use-cases/enrollments/EnrollStudentUseCase'
import { GetMyEnrollmentsUseCase } from '@/application/use-cases/enrollments/GetMyEnrollmentsUseCase'
import { enrollSchema } from '@/presentation/api/schemas/enrollment.schema'
import { parsePagination } from '@/presentation/api/pagination'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'STUDENT') throw new ForbiddenError()

    const params = parsePagination(request.nextUrl.searchParams)
    const enrollmentRepo = new PrismaEnrollmentRepository()
    const useCase = new GetMyEnrollmentsUseCase(enrollmentRepo)
    const result = await useCase.execute(userId, params)

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'STUDENT') throw new ForbiddenError()

    const body = await request.json()
    const parsed = enrollSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const enrollmentRepo = new PrismaEnrollmentRepository()
    const courseRepo = new PrismaCourseRepository()
    const useCase = new EnrollStudentUseCase(enrollmentRepo, courseRepo)
    const enrollment = await useCase.execute({ studentId: userId, courseId: parsed.data.courseId })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

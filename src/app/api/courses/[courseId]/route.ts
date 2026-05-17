import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { GetCourseUseCase } from '@/application/use-cases/courses/GetCourseUseCase'
import { UpdateCourseUseCase } from '@/application/use-cases/courses/UpdateCourseUseCase'
import { updateCourseSchema } from '@/presentation/api/schemas/course.schema'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const { courseId } = await params
    const courseRepo = new PrismaCourseRepository()
    const useCase = new GetCourseUseCase(courseRepo)
    const course = await useCase.execute(courseId)
    return NextResponse.json(course)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'ADMIN') throw new ForbiddenError()

    const { courseId } = await params
    const body = await request.json()
    const parsed = updateCourseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const courseRepo = new PrismaCourseRepository()
    const useCase = new UpdateCourseUseCase(courseRepo)
    const course = await useCase.execute(courseId, parsed.data)

    return NextResponse.json(course)
  } catch (error) {
    return handleApiError(error)
  }
}

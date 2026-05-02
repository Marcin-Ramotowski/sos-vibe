import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { ListCoursesUseCase } from '@/application/use-cases/courses/ListCoursesUseCase'
import { CreateCourseUseCase } from '@/application/use-cases/courses/CreateCourseUseCase'
import { createCourseSchema } from '@/presentation/api/schemas/course.schema'
import { parsePagination } from '@/presentation/api/pagination'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    const params = parsePagination(request.nextUrl.searchParams)

    const courseRepo = new PrismaCourseRepository()
    const useCase = new ListCoursesUseCase(courseRepo)
    const result = await useCase.execute({ ...params, role: userRole, userId })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'ADMIN') throw new ForbiddenError()

    const body = await request.json()
    const parsed = createCourseSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const courseRepo = new PrismaCourseRepository()
    const useCase = new CreateCourseUseCase(courseRepo)
    const course = await useCase.execute(parsed.data)

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

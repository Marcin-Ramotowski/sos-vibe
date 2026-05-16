import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { ListCoursesUseCase } from '@/application/use-cases/courses/ListCoursesUseCase'
import { CreateCourseUseCase } from '@/application/use-cases/courses/CreateCourseUseCase'
import { createCourseSchema, courseQuerySchema } from '@/presentation/api/schemas/course.schema'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function GET(request: NextRequest) {
  const parsed = courseQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  )
  if (!parsed.success) {
    return NextResponse.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Nieprawidłowe parametry zapytania',
        errors: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 },
    )
  }

  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    const { page, limit, search, available, lecturerId } = parsed.data

    const courseRepo = new PrismaCourseRepository()
    const useCase = new ListCoursesUseCase(courseRepo)
    const result = await useCase.execute({
      page,
      limit,
      role: userRole,
      userId,
      search,
      available,
      lecturerId,
    })

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

import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { PrismaUserRepository } from '@/infrastructure/repositories/PrismaUserRepository'
import { AssignLecturerUseCase } from '@/application/use-cases/courses/AssignLecturerUseCase'
import { assignLecturerSchema } from '@/presentation/api/schemas/course.schema'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'ADMIN') throw new ForbiddenError()

    const { courseId } = await params
    const body = await request.json()
    const parsed = assignLecturerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const courseRepo = new PrismaCourseRepository()
    const userRepo = new PrismaUserRepository()
    const useCase = new AssignLecturerUseCase(courseRepo, userRepo)
    const course = await useCase.execute({ courseId, lecturerId: parsed.data.lecturerId })

    return NextResponse.json(course)
  } catch (error) {
    return handleApiError(error)
  }
}

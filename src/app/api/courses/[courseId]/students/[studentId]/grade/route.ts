import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaGradeRepository } from '@/infrastructure/repositories/PrismaGradeRepository'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { PrismaEnrollmentRepository } from '@/infrastructure/repositories/PrismaEnrollmentRepository'
import { PrismaNotificationRepository } from '@/infrastructure/repositories/PrismaNotificationRepository'
import { UpsertGradeUseCase } from '@/application/use-cases/grades/UpsertGradeUseCase'
import { upsertGradeSchema } from '@/presentation/api/schemas/grade.schema'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError } from '@/domain/errors'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; studentId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    if (userRole !== 'LECTURER' && userRole !== 'ADMIN') throw new ForbiddenError()

    const { courseId, studentId } = await params
    const body = await request.json()
    const parsed = upsertGradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Błąd walidacji' },
        { status: 422 },
      )
    }

    const gradeRepo = new PrismaGradeRepository()
    const courseRepo = new PrismaCourseRepository()
    const enrollmentRepo = new PrismaEnrollmentRepository()
    const notificationRepo = new PrismaNotificationRepository()
    const useCase = new UpsertGradeUseCase(gradeRepo, courseRepo, enrollmentRepo, notificationRepo)

    const grade = await useCase.execute({
      courseId,
      studentId,
      value: parsed.data.value,
      lecturerId: userId,
    })

    return NextResponse.json(grade)
  } catch (error) {
    return handleApiError(error)
  }
}

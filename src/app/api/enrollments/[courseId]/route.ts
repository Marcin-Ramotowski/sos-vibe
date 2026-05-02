import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaEnrollmentRepository } from '@/infrastructure/repositories/PrismaEnrollmentRepository'
import { UnenrollStudentUseCase } from '@/application/use-cases/enrollments/UnenrollStudentUseCase'
import { handleApiError } from '@/presentation/api/error-handler'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    const { courseId } = await params

    const enrollmentRepo = new PrismaEnrollmentRepository()
    const useCase = new UnenrollStudentUseCase(enrollmentRepo)

    await useCase.execute({
      studentId: userId,
      courseId,
      requestingUserId: userId,
      requestingUserRole: userRole,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}

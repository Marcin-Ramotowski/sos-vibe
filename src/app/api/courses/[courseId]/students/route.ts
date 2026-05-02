import { NextRequest, NextResponse } from 'next/server'
import type { UserRole } from '@/domain/entities/user.entity'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { parsePagination } from '@/presentation/api/pagination'
import { handleApiError } from '@/presentation/api/error-handler'
import { ForbiddenError, NotFoundError } from '@/domain/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')!
    const userRole = request.headers.get('x-user-role') as UserRole
    const { courseId } = await params
    const pagination = parsePagination(request.nextUrl.searchParams)

    const courseRepo = new PrismaCourseRepository()

    if (userRole === 'LECTURER') {
      const course = await courseRepo.findById(courseId)
      if (!course) throw new NotFoundError('Kurs')
      if (course.lecturerId !== userId) throw new ForbiddenError()
    } else if (userRole !== 'ADMIN') {
      throw new ForbiddenError()
    }

    const result = await courseRepo.getStudentList(courseId, pagination)
    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

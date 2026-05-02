import { NextRequest, NextResponse } from 'next/server'
import { PrismaCourseRepository } from '@/infrastructure/repositories/PrismaCourseRepository'
import { GetCourseUseCase } from '@/application/use-cases/courses/GetCourseUseCase'
import { handleApiError } from '@/presentation/api/error-handler'

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

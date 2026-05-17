import { NextRequest, NextResponse } from 'next/server'
import { PrismaNotificationRepository } from '@/infrastructure/repositories/PrismaNotificationRepository'
import { MarkNotificationReadUseCase } from '@/application/use-cases/notifications/MarkNotificationReadUseCase'
import { handleApiError } from '@/presentation/api/error-handler'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = request.headers.get('x-user-id')! // middleware guarantees presence
    const { id } = await params
    const notificationRepo = new PrismaNotificationRepository()
    const useCase = new MarkNotificationReadUseCase(notificationRepo)
    const notification = await useCase.execute(id, userId)
    return NextResponse.json(notification)
  } catch (error) {
    return handleApiError(error)
  }
}

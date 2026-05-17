import { NextRequest, NextResponse } from 'next/server'
import { PrismaNotificationRepository } from '@/infrastructure/repositories/PrismaNotificationRepository'
import { GetNotificationsUseCase } from '@/application/use-cases/notifications/GetNotificationsUseCase'
import { handleApiError } from '@/presentation/api/error-handler'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')! // middleware guarantees presence
    const notificationRepo = new PrismaNotificationRepository()
    const useCase = new GetNotificationsUseCase(notificationRepo)
    const notifications = await useCase.execute(userId)
    return NextResponse.json(notifications)
  } catch (error) {
    return handleApiError(error)
  }
}

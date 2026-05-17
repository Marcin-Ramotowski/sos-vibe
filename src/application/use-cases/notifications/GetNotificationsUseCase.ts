import type { INotificationRepository } from '@/domain/repositories/INotificationRepository'
import type { Notification } from '@/domain/entities/notification.entity'

export class GetNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(userId: string): Promise<Notification[]> {
    return this.notificationRepo.findUnreadByUserId(userId)
  }
}

import type { INotificationRepository } from '@/domain/repositories/INotificationRepository'
import type { Notification } from '@/domain/entities/notification.entity'

export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(id: string, userId: string): Promise<Notification> {
    return this.notificationRepo.markAsRead(id, userId)
    // markAsRead throws NotFoundError → handleApiError maps it to 404
  }
}

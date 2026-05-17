import type { Notification, NotificationType, NotificationPayload } from '@/domain/entities/notification.entity'

export interface CreateNotificationData {
  userId: string
  type: NotificationType
  payload: NotificationPayload
}

export interface INotificationRepository {
  create(data: CreateNotificationData): Promise<Notification>
  findUnreadByUserId(userId: string): Promise<Notification[]>
  markAsRead(id: string, userId: string): Promise<Notification>
}

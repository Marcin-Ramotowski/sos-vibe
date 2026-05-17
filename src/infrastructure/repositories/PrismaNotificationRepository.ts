import prisma from '@/infrastructure/database/prisma'
import type { Notification as PrismaNotification } from '@prisma/client'
import type { INotificationRepository, CreateNotificationData } from '@/domain/repositories/INotificationRepository'
import type { Notification, NotificationType, NotificationPayload } from '@/domain/entities/notification.entity'
import { NotFoundError } from '@/domain/errors'

export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationData): Promise<Notification> {
    const n = await prisma.notification.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { userId: data.userId, type: data.type, payload: data.payload as any },
    })
    return this.mapNotification(n)
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((n) => this.mapNotification(n))
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) throw new NotFoundError('Powiadomienie')
    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })
    return this.mapNotification(updated)
  }

  private mapNotification(n: PrismaNotification): Notification {
    return {
      id: n.id,
      userId: n.userId,
      type: n.type as NotificationType,
      payload: n.payload as NotificationPayload,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }
  }
}

export type NotificationType = 'GRADE_ASSIGNED' | 'STUDENT_ENROLLED'

export interface NotificationPayload {
  courseId?: string
  gradeValue?: number
  studentId?: string
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  payload: NotificationPayload
  readAt: Date | null
  createdAt: Date
}

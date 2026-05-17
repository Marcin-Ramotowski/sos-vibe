export interface Course {
  id: string
  name: string
  description: string | null
  capacity: number
  enrolledCount: number
  lecturerId: string | null
  startDate: Date | null
  endDate: Date | null
  enrollmentDeadline: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CourseWithLecturer extends Course {
  lecturer: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export type EnrollmentStatus = 'ENROLLED' | 'NOT_ENROLLED' | 'FULL'

export interface CourseWithStatus extends CourseWithLecturer {
  enrollmentStatus?: EnrollmentStatus
}

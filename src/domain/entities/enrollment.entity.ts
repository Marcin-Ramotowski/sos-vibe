export interface Enrollment {
  id: string
  studentId: string
  courseId: string
  enrolledAt: Date
}

export interface EnrollmentWithDetails extends Enrollment {
  course: {
    id: string
    name: string
    description: string | null
    lecturer: {
      id: string
      firstName: string
      lastName: string
    } | null
  }
  grade: {
    id: string
    value: number
    gradedById: string
  } | null
}

export const VALID_GRADES = [2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5] as const
export type GradeValue = (typeof VALID_GRADES)[number]

export function isValidGrade(value: number): value is GradeValue {
  return VALID_GRADES.includes(value as GradeValue)
}

export interface Grade {
  id: string
  enrollmentId: string
  value: number
  gradedById: string
  createdAt: Date
  updatedAt: Date
}

export interface GradeWithDetails extends Grade {
  enrollment: {
    studentId: string
    courseId: string
    course: {
      name: string
    }
    student?: {
      firstName: string
      lastName: string
      email: string
    }
  }
}

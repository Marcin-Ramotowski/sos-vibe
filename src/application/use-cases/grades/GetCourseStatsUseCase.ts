import type { IGradeRepository } from '@/domain/repositories/IGradeRepository'
import type { ICourseRepository } from '@/domain/repositories/ICourseRepository'
import type { UserRole } from '@/domain/entities/user.entity'
import { VALID_GRADES } from '@/domain/entities/grade.entity'
import { ForbiddenError, NotFoundError } from '@/domain/errors'

export interface GetCourseStatsInput {
  courseId: string
  userId: string
  userRole: UserRole
}

export interface CourseStats {
  mean: number
  median: number
  passRate: number
  distribution: Record<string, number>
}

export class GetCourseStatsUseCase {
  constructor(
    private readonly gradeRepo: IGradeRepository,
    private readonly courseRepo: ICourseRepository,
  ) {}

  async execute(input: GetCourseStatsInput): Promise<CourseStats> {
    const { courseId, userId, userRole } = input

    if (userRole === 'LECTURER') {
      const course = await this.courseRepo.findById(courseId)
      if (!course) throw new NotFoundError('Kurs')
      if (course.lecturerId !== userId) throw new ForbiddenError()
    } else if (userRole !== 'ADMIN') {
      throw new ForbiddenError()
    }

    const grades = await this.gradeRepo.findByCourseId(courseId)
    return computeStats(grades)
  }
}

export function computeStats(grades: number[]): CourseStats {
  const distribution: Record<string, number> = Object.fromEntries(
    VALID_GRADES.map((v) => [String(v), 0]),
  )

  if (grades.length === 0) {
    return { mean: 0, median: 0, passRate: 0, distribution }
  }

  for (const v of grades) {
    const key = String(v)
    if (key in distribution) distribution[key]++
  }

  const mean = grades.reduce((sum, v) => sum + v, 0) / grades.length

  const sorted = [...grades].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

  const passing = grades.filter((v) => v >= 3.0).length
  const passRate = (passing / grades.length) * 100

  return { mean, median, passRate, distribution }
}

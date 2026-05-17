import type { IGradeRepository, UpsertGradeData } from '@/domain/repositories/IGradeRepository'
import type { Grade, GradeWithDetails } from '@/domain/entities/grade.entity'
import type { PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'
import prisma from '@/infrastructure/database/prisma'

export class PrismaGradeRepository implements IGradeRepository {
  async findByEnrollmentId(enrollmentId: string): Promise<Grade | null> {
    const g = await prisma.grade.findUnique({ where: { enrollmentId } })
    if (!g) return null
    return this.mapGrade(g)
  }

  async findByStudentId(
    studentId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<GradeWithDetails>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where: {
          enrollment: { studentId },
        },
        skip,
        take: limit,
        include: {
          enrollment: {
            include: {
              course: { select: { name: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.grade.count({ where: { enrollment: { studentId } } }),
    ])

    return {
      data: grades.map((g) => ({
        id: g.id,
        enrollmentId: g.enrollmentId,
        value: Number(g.value),
        gradedById: g.gradedById,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
        enrollment: {
          studentId: g.enrollment.studentId,
          courseId: g.enrollment.courseId,
          course: { name: g.enrollment.course.name },
        },
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async findByCourseId(courseId: string): Promise<number[]> {
    const grades = await prisma.grade.findMany({
      where: { enrollment: { courseId } },
      select: { value: true },
    })
    return grades.map((g) => Number(g.value))
  }

  async upsertWithAudit(data: UpsertGradeData): Promise<Grade> {
    const { enrollmentId, value, gradedById } = data

    return prisma.$transaction(async (tx) => {
      const existing = await tx.grade.findUnique({ where: { enrollmentId } })

      const grade = await tx.grade.upsert({
        where: { enrollmentId },
        create: { enrollmentId, value, gradedById },
        update: { value, gradedById },
      })

      await tx.gradeAuditLog.create({
        data: {
          gradeId: grade.id,
          enrollmentId,
          oldValue: existing?.value ?? null,
          newValue: value,
          changedById: gradedById,
        },
      })

      return this.mapGrade(grade)
    })
  }

  private mapGrade(g: {
    id: string
    enrollmentId: string
    value: { toString(): string }
    gradedById: string
    createdAt: Date
    updatedAt: Date
  }): Grade {
    return {
      id: g.id,
      enrollmentId: g.enrollmentId,
      value: Number(g.value),
      gradedById: g.gradedById,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }
  }
}

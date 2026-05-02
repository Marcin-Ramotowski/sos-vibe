import { Prisma } from '@prisma/client'
import type { IEnrollmentRepository } from '@/domain/repositories/IEnrollmentRepository'
import type { Enrollment, EnrollmentWithDetails } from '@/domain/entities/enrollment.entity'
import type { PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'
import { CourseFullError, AlreadyEnrolledError } from '@/domain/errors'
import prisma from '@/infrastructure/database/prisma'

export class PrismaEnrollmentRepository implements IEnrollmentRepository {
  async findById(id: string): Promise<Enrollment | null> {
    const e = await prisma.enrollment.findUnique({ where: { id } })
    if (!e) return null
    return this.mapEnrollment(e)
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<Enrollment | null> {
    const e = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    })
    if (!e) return null
    return this.mapEnrollment(e)
  }

  async findByStudentId(
    studentId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<EnrollmentWithDetails>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId },
        skip,
        take: limit,
        include: {
          course: {
            include: {
              lecturer: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          grade: { select: { id: true, value: true, gradedById: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.enrollment.count({ where: { studentId } }),
    ])

    return {
      data: enrollments.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        courseId: e.courseId,
        enrolledAt: e.enrolledAt,
        course: {
          id: e.course.id,
          name: e.course.name,
          description: e.course.description,
          lecturer: e.course.lecturer,
        },
        grade: e.grade
          ? { id: e.grade.id, value: Number(e.grade.value), gradedById: e.grade.gradedById }
          : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async enrollAtomic(studentId: string, courseId: string): Promise<Enrollment> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Check existing enrollment first to give a better error early
        const existing = await tx.enrollment.findUnique({
          where: { studentId_courseId: { studentId, courseId } },
        })
        if (existing) throw new AlreadyEnrolledError()

        // Atomic update: only succeeds if there's capacity
        const result = await tx.$executeRaw`
          UPDATE courses
          SET "enrolledCount" = "enrolledCount" + 1
          WHERE id = ${courseId} AND "enrolledCount" < capacity
        `

        if (result === 0) throw new CourseFullError()

        const enrollment = await tx.enrollment.create({
          data: { studentId, courseId },
        })
        return this.mapEnrollment(enrollment)
      })
    } catch (err) {
      // Handle race-condition P2002 (duplicate enrollment via concurrent requests)
      // — caught outside the transaction so no further queries run in the aborted tx
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new AlreadyEnrolledError()
      }
      throw err
    }
  }

  async unenroll(enrollmentId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.findUnique({ where: { id: enrollmentId } })
      if (!enrollment) return

      await tx.enrollment.delete({ where: { id: enrollmentId } })
      await tx.$executeRaw`
        UPDATE courses
        SET "enrolledCount" = "enrolledCount" - 1
        WHERE id = ${enrollment.courseId} AND "enrolledCount" > 0
      `
    })
  }

  async hasGrade(enrollmentId: string): Promise<boolean> {
    const grade = await prisma.grade.findUnique({ where: { enrollmentId } })
    return grade !== null
  }

  private mapEnrollment(e: {
    id: string
    studentId: string
    courseId: string
    enrolledAt: Date
  }): Enrollment {
    return {
      id: e.id,
      studentId: e.studentId,
      courseId: e.courseId,
      enrolledAt: e.enrolledAt,
    }
  }
}

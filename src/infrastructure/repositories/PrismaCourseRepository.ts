import type {
  ICourseRepository,
  CreateCourseData,
} from '@/domain/repositories/ICourseRepository'
import type { Course, CourseWithLecturer, CourseWithStatus } from '@/domain/entities/course.entity'
import type { PaginationParams, PaginatedResult } from '@/domain/repositories/IUserRepository'
import prisma from '@/infrastructure/database/prisma'

type PrismaUser = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type PrismaCourseWithLecturer = {
  id: string
  name: string
  description: string | null
  capacity: number
  enrolledCount: number
  lecturerId: string | null
  createdAt: Date
  updatedAt: Date
  lecturer: PrismaUser | null
}

function mapCourse(c: PrismaCourseWithLecturer): CourseWithLecturer {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    capacity: c.capacity,
    enrolledCount: c.enrolledCount,
    lecturerId: c.lecturerId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    lecturer: c.lecturer
      ? {
          id: c.lecturer.id,
          firstName: c.lecturer.firstName,
          lastName: c.lecturer.lastName,
          email: c.lecturer.email,
        }
      : null,
  }
}

const lecturerInclude = {
  lecturer: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
}

export class PrismaCourseRepository implements ICourseRepository {
  async findById(id: string): Promise<CourseWithLecturer | null> {
    const course = await prisma.course.findUnique({
      where: { id },
      include: lecturerInclude,
    })
    if (!course) return null
    return mapCourse(course)
  }

  async findAll(params: PaginationParams): Promise<PaginatedResult<CourseWithLecturer>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        skip,
        take: limit,
        include: lecturerInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count(),
    ])

    return {
      data: courses.map(mapCourse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async findAllWithEnrollmentStatus(
    params: PaginationParams,
    studentId: string,
  ): Promise<PaginatedResult<CourseWithStatus>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        skip,
        take: limit,
        include: {
          ...lecturerInclude,
          enrollments: {
            where: { studentId },
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count(),
    ])

    return {
      data: courses.map((c) => {
        const base = mapCourse(c)
        let enrollmentStatus: CourseWithStatus['enrollmentStatus']
        if (c.enrollments.length > 0) {
          enrollmentStatus = 'ENROLLED'
        } else if (c.enrolledCount >= c.capacity) {
          enrollmentStatus = 'FULL'
        } else {
          enrollmentStatus = 'NOT_ENROLLED'
        }
        return { ...base, enrollmentStatus }
      }),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async findByLecturerId(
    lecturerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<CourseWithLecturer>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { lecturerId },
        skip,
        take: limit,
        include: lecturerInclude,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where: { lecturerId } }),
    ])

    return {
      data: courses.map(mapCourse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async create(data: CreateCourseData): Promise<Course> {
    const course = await prisma.course.create({ data })
    return {
      id: course.id,
      name: course.name,
      description: course.description,
      capacity: course.capacity,
      enrolledCount: course.enrolledCount,
      lecturerId: course.lecturerId,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }
  }

  async assignLecturer(courseId: string, lecturerId: string): Promise<CourseWithLecturer> {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { lecturerId },
      include: lecturerInclude,
    })
    return mapCourse(course)
  }

  async getStudentList(
    courseId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<{
    id: string
    studentId: string
    student: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    grade: {
      id: string
      value: number
    } | null
  }>> {
    const { page, limit } = params
    const skip = (page - 1) * limit

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: { courseId },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
          grade: { select: { id: true, value: true } },
        },
        orderBy: { enrolledAt: 'asc' },
      }),
      prisma.enrollment.count({ where: { courseId } }),
    ])

    return {
      data: enrollments.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        student: e.student,
        grade: e.grade ? { id: e.grade.id, value: Number(e.grade.value) } : null,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}

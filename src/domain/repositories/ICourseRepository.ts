import type { Course, CourseWithLecturer, CourseWithStatus } from '../entities/course.entity'
import type { PaginationParams, PaginatedResult } from './IUserRepository'

export interface CreateCourseData {
  name: string
  description?: string
  capacity: number
}

export interface ICourseRepository {
  findById(id: string): Promise<CourseWithLecturer | null>
  findAll(params: PaginationParams): Promise<PaginatedResult<CourseWithLecturer>>
  findAllWithEnrollmentStatus(
    params: PaginationParams,
    studentId: string,
  ): Promise<PaginatedResult<CourseWithStatus>>
  findByLecturerId(lecturerId: string, params: PaginationParams): Promise<PaginatedResult<CourseWithLecturer>>
  create(data: CreateCourseData): Promise<Course>
  assignLecturer(courseId: string, lecturerId: string): Promise<CourseWithLecturer>
  getStudentList(courseId: string, params: PaginationParams): Promise<PaginatedResult<{
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
  }>>
}

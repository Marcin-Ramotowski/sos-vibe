import { NextResponse } from 'next/server'
import {
  DomainError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  CourseFullError,
  AlreadyEnrolledError,
  GradeExistsError,
  ValidationError,
  EnrollmentClosedError,
} from '@/domain/errors'

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 401 })
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 403 })
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 404 })
  }
  if (error instanceof CourseFullError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 409 })
  }
  if (error instanceof AlreadyEnrolledError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 409 })
  }
  if (error instanceof GradeExistsError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 409 })
  }
  if (error instanceof EnrollmentClosedError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 409 })
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 422 })
  }
  if (error instanceof DomainError) {
    return NextResponse.json({ code: error.code, message: error.message }, { status: 400 })
  }

  console.error('Unexpected error:', error)
  return NextResponse.json(
    { code: 'INTERNAL_ERROR', message: 'Wewnętrzny błąd serwera' },
    { status: 500 },
  )
}

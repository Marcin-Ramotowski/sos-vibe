export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = this.constructor.name
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Nieautoryzowany dostęp') {
    super('UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Brak uprawnień') {
    super('FORBIDDEN', message)
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} nie został znaleziony`)
  }
}

export class CourseFullError extends DomainError {
  constructor() {
    super('COURSE_FULL', 'Brak wolnych miejsc')
  }
}

export class AlreadyEnrolledError extends DomainError {
  constructor() {
    super('ALREADY_ENROLLED', 'Jesteś już zapisany na ten kurs')
  }
}

export class GradeExistsError extends DomainError {
  constructor() {
    super('GRADE_EXISTS', 'Nie można wypisać się z kursu - ocena jest już wystawiona')
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message)
  }
}

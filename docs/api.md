# API Reference

Base URL: `http://localhost:3000/api`

## Authentication

All protected endpoints require an active session (cookie-based via JWT). Log in first to obtain a session cookie.

---

## Endpoints

### POST /auth/login

Log in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response** (401):
```json
{
  "code": "UNAUTHORIZED",
  "message": "Wymagane logowanie"
}
```

---

### POST /auth/logout

Log out — clears the session cookie.

**Response** (200):
```json
{
  "message": "Wylogowano"
}
```

---

### GET /auth/me

Returns the currently logged-in user.

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "STUDENT",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /courses

Returns a paginated list of courses. Behaviour differs by role:
- **STUDENT** — all courses with personal status (`AVAILABLE` / `ENROLLED` / `FULL`)
- **LECTURER** — only courses they teach
- **ADMIN** — all courses

**Query params:** `page` (default: 1), `limit` (default: 20, max: 100)

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Matematyka",
      "description": "Analiza matematyczna",
      "capacity": 30,
      "enrolledCount": 12,
      "freeSpots": 18,
      "lecturer": {
        "id": "uuid",
        "firstName": "Anna",
        "lastName": "Nowak"
      },
      "enrollmentStatus": "AVAILABLE",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### POST /courses

Create a new course. **ADMIN only.**

**Request:**
```json
{
  "name": "Matematyka",
  "description": "Analiza matematyczna",
  "capacity": 30,
  "lecturerId": "uuid"
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "name": "Matematyka",
  "description": "Analiza matematyczna",
  "capacity": 30,
  "enrolledCount": 0,
  "freeSpots": 30,
  "lecturer": null,
  "enrollmentStatus": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /courses/{courseId}

Returns details of a single course.

**Response** (200):
```json
{
  "id": "uuid",
  "name": "Matematyka",
  "description": "Analiza matematyczna",
  "capacity": 30,
  "enrolledCount": 12,
  "freeSpots": 18,
  "lecturer": {
    "id": "uuid",
    "firstName": "Anna",
    "lastName": "Nowak"
  },
  "enrollmentStatus": "ENROLLED",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /courses/{courseId}/lecturer

Assign (or unassign) a lecturer to a course. **ADMIN only.**

**Request:**
```json
{
  "lecturerId": "uuid"
}
```

Set `lecturerId` to `null` to unassign the lecturer.

**Response** (200): same as `GET /courses/{courseId}`

---

### GET /courses/{courseId}/students

Returns a paginated list of students enrolled in a course, with their grades. **LECTURER of this course or ADMIN only.**

**Query params:** `page`, `limit`

**Response** (200):
```json
{
  "courseId": "uuid",
  "courseName": "Matematyka",
  "data": [
    {
      "studentId": "uuid",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "email": "jan@example.com",
      "enrolledAt": "2024-01-10T00:00:00.000Z",
      "grade": {
        "value": 4.5,
        "gradedAt": "2024-02-01T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### GET /enrollments

Returns courses the student is enrolled in. **STUDENT only.**

**Query params:** `page`, `limit`

**Response** (200):
```json
{
  "data": [
    {
      "enrollmentId": "uuid",
      "course": {
        "id": "uuid",
        "name": "Matematyka",
        "capacity": 30,
        "enrolledCount": 12,
        "freeSpots": 18,
        "lecturer": {
          "id": "uuid",
          "firstName": "Anna",
          "lastName": "Nowak"
        },
        "enrollmentStatus": "ENROLLED",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "grade": {
        "value": 4.5,
        "gradedAt": "2024-02-01T00:00:00.000Z"
      },
      "enrolledAt": "2024-01-10T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### POST /enrollments

Enroll the logged-in student in a course. **STUDENT only.** Atomic operation — race condition safe.

**Request:**
```json
{
  "courseId": "uuid"
}
```

**Response** (201):
```json
{
  "enrollmentId": "uuid",
  "courseId": "uuid",
  "courseName": "Matematyka",
  "enrolledAt": "2024-01-10T00:00:00.000Z"
}
```

**Response** (409 — course full):
```json
{
  "code": "COURSE_FULL",
  "message": "Brak wolnych miejsc na kursie"
}
```

**Response** (409 — already enrolled):
```json
{
  "code": "ALREADY_ENROLLED",
  "message": "Jesteś już zapisany na ten kurs"
}
```

---

### DELETE /enrollments/{courseId}

Unenroll the logged-in student from a course. **STUDENT only.** Blocked if a grade has already been assigned.

**Response** (200):
```json
{
  "message": "Wypisano z kursu"
}
```

**Response** (409):
```json
{
  "code": "GRADE_EXISTS",
  "message": "Nie możesz się wypisać — masz wystawioną ocenę z tego kursu"
}
```

---

### GET /grades/mine

Returns all grades for the logged-in student. **STUDENT only.**

**Query params:** `page`, `limit`

**Response** (200):
```json
{
  "data": [
    {
      "courseId": "uuid",
      "courseName": "Matematyka",
      "grade": {
        "value": 4.5,
        "gradedAt": "2024-02-01T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

### PUT /courses/{courseId}/students/{studentId}/grade

Create or update a student's grade. **LECTURER of this course only.** Idempotent — every change is recorded in the audit log.

**Request:**
```json
{
  "value": 4.5
}
```

Valid grade values: `2.0`, `3.0`, `3.5`, `4.0`, `4.5`, `5.0`, `5.5`

**Response** (200):
```json
{
  "gradeId": "uuid",
  "enrollmentId": "uuid",
  "value": 4.5,
  "gradedBy": {
    "id": "uuid",
    "firstName": "Anna",
    "lastName": "Nowak"
  },
  "createdAt": "2024-02-01T00:00:00.000Z",
  "updatedAt": "2024-02-01T00:00:00.000Z"
}
```

---

### GET /users

Returns a paginated list of all users. **ADMIN only.**

**Query params:** `page`, `limit`

**Response** (200):
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "Jan",
      "lastName": "Kowalski",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### PATCH /users/{userId}/role

Change a user's role. **ADMIN only.**

**Request:**
```json
{
  "role": "LECTURER"
}
```

Valid roles: `STUDENT`, `LECTURER`, `ADMIN`

**Response** (200):
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "role": "LECTURER",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /health

Health check — no authentication required.

**Response** (200):
```json
{
  "status": "ok",
  "db": "ok"
}
```

import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = 'http://localhost:3000'

async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/token=([^;]+)/)
  return match?.[1] ?? ''
}

async function authFetch(path: string, token: string, options: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: `token=${token}`,
      'Content-Type': 'application/json',
    },
  })
}

async function createCourse(adminToken: string, name: string, capacity = 30): Promise<string> {
  const res = await authFetch('/api/courses', adminToken, {
    method: 'POST',
    body: JSON.stringify({ name, capacity }),
  })
  const data = await res.json()
  return data.id
}

async function getLecturerId(adminToken: string): Promise<string> {
  const res = await authFetch('/api/users?limit=100', adminToken)
  const data = await res.json()
  const lecturer = data.data.find((u: { role: string; id: string }) => u.role === 'LECTURER')
  return lecturer?.id ?? ''
}

async function getStudentId(adminToken: string): Promise<string> {
  const res = await authFetch('/api/users?limit=100', adminToken)
  const data = await res.json()
  const student = data.data.find((u: { role: string; id: string }) => u.role === 'STUDENT')
  return student?.id ?? ''
}

describe('Grades API', () => {
  let adminToken: string
  let studentToken: string
  let lecturerToken: string
  let testCourseId: string
  let lecturerId: string
  let studentId: string

  beforeAll(async () => {
    adminToken = await login('admin@uni.pl', 'admin123')
    studentToken = await login('student@uni.pl', 'student123')
    lecturerToken = await login('lecturer@uni.pl', 'lecturer123')

    lecturerId = await getLecturerId(adminToken)
    studentId = await getStudentId(adminToken)

    // Create a course and assign lecturer
    testCourseId = await createCourse(adminToken, `Grades Test Course ${Date.now()}`)

    // Assign lecturer
    await authFetch(`/api/courses/${testCourseId}/lecturer`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ lecturerId }),
    })

    // Enroll student
    await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId: testCourseId }),
    })
  })

  it('should return 403 when student tries to assign grade', async () => {
    const res = await authFetch(
      `/api/courses/${testCourseId}/students/${studentId}/grade`,
      studentToken,
      { method: 'PUT', body: JSON.stringify({ value: 4.0 }) },
    )
    expect(res.status).toBe(403)
  })

  it('should assign grade by lecturer', async () => {
    const res = await authFetch(
      `/api/courses/${testCourseId}/students/${studentId}/grade`,
      lecturerToken,
      { method: 'PUT', body: JSON.stringify({ value: 4.5 }) },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.value).toBe(4.5)
  })

  it('should update grade (upsert)', async () => {
    const res = await authFetch(
      `/api/courses/${testCourseId}/students/${studentId}/grade`,
      lecturerToken,
      { method: 'PUT', body: JSON.stringify({ value: 5.0 }) },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.value).toBe(5.0)
  })

  it('should return 422 for invalid grade', async () => {
    const res = await authFetch(
      `/api/courses/${testCourseId}/students/${studentId}/grade`,
      lecturerToken,
      { method: 'PUT', body: JSON.stringify({ value: 2.7 }) },
    )
    expect(res.status).toBe(422)
  })

  it('should get student grades', async () => {
    const res = await authFetch('/api/grades/mine', studentToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toBeInstanceOf(Array)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('should return 403 when admin tries to get student grades endpoint', async () => {
    const res = await authFetch('/api/grades/mine', adminToken)
    expect(res.status).toBe(403)
  })

  it('should block unenrollment when grade exists', async () => {
    const res = await authFetch(`/api/enrollments/${testCourseId}`, studentToken, {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.code).toBe('GRADE_EXISTS')
  })
})

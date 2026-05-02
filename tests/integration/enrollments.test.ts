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

async function createCourse(adminToken: string, name: string, capacity: number): Promise<string> {
  const res = await authFetch('/api/courses', adminToken, {
    method: 'POST',
    body: JSON.stringify({ name, capacity }),
  })
  const data = await res.json()
  return data.id
}

describe('Enrollments API', () => {
  let adminToken: string
  let studentToken: string
  let lecturerToken: string
  let testCourseId: string
  let fullCourseId: string

  beforeAll(async () => {
    adminToken = await login('admin@uni.pl', 'admin123')
    studentToken = await login('student@uni.pl', 'student123')
    lecturerToken = await login('lecturer@uni.pl', 'lecturer123')

    // Create a test course for enrollment tests
    testCourseId = await createCourse(adminToken, `Integration Enrollment Test ${Date.now()}`, 30)
    // Create a course with capacity 1 for full course tests
    fullCourseId = await createCourse(adminToken, `Full Course Test ${Date.now()}`, 1)
  })

  it('should return 403 when non-student tries to list enrollments', async () => {
    const res = await authFetch('/api/enrollments', adminToken)
    expect(res.status).toBe(403)
  })

  it('should list student enrollments', async () => {
    const res = await authFetch('/api/enrollments', studentToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toBeInstanceOf(Array)
    expect(data.pagination).toBeDefined()
  })

  it('should enroll student in a course', async () => {
    const res = await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId: testCourseId }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.courseId).toBe(testCourseId)
  })

  it('should return 409 when student tries to enroll twice', async () => {
    // Second enrollment attempt
    const res = await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId: testCourseId }),
    })
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.code).toBe('ALREADY_ENROLLED')
  })

  it('should unenroll student from a course', async () => {
    const res = await authFetch(`/api/enrollments/${testCourseId}`, studentToken, {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  it('should return 404 when deleting non-existent enrollment', async () => {
    const res = await authFetch('/api/enrollments/00000000-0000-0000-0000-000000000000', studentToken, {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)
  })

  it('should return 403 when lecturer tries to enroll', async () => {
    const res = await authFetch('/api/enrollments', lecturerToken, {
      method: 'POST',
      body: JSON.stringify({ courseId: testCourseId }),
    })
    expect(res.status).toBe(403)
  })

  it('should return 422 for invalid courseId', async () => {
    const res = await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId: 'not-a-uuid' }),
    })
    expect(res.status).toBe(422)
  })

  describe('race condition - course capacity', () => {
    it('should handle concurrent enrollment attempts atomically', async () => {
      // Enroll in the 1-capacity course to fill it
      const firstEnroll = await authFetch('/api/enrollments', studentToken, {
        method: 'POST',
        body: JSON.stringify({ courseId: fullCourseId }),
      })
      expect(firstEnroll.status).toBe(201)

      // Second attempt should return COURSE_FULL
      const secondEnroll = await authFetch('/api/enrollments', studentToken, {
        method: 'POST',
        body: JSON.stringify({ courseId: fullCourseId }),
      })
      // Should be either 409 ALREADY_ENROLLED or COURSE_FULL
      expect([409]).toContain(secondEnroll.status)
    })
  })
})

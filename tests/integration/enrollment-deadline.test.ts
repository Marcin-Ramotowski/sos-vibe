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

describe('Enrollment Deadline', () => {
  let adminToken: string
  let studentToken: string

  beforeAll(async () => {
    adminToken = await login('admin@uni.pl', 'admin123')
    studentToken = await login('student@uni.pl', 'student123')
  })

  it('[AC-010-3] POST /api/enrollments returns 409 ENROLLMENT_CLOSED when deadline has passed', async () => {
    // Admin creates course with an enrollment deadline in the past
    const createRes = await authFetch('/api/courses', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Kurs z minietym terminem',
        capacity: 30,
        enrollmentDeadline: '2020-01-01',
      }),
    })
    expect(createRes.status).toBe(201)
    const course = await createRes.json()
    const courseId = course.id

    // Student tries to enroll
    const enrollRes = await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    })

    expect(enrollRes.status).toBe(409)
    const body = await enrollRes.json()
    expect(body.code).toBe('ENROLLMENT_CLOSED')
  })

  it('POST /api/enrollments succeeds when no enrollmentDeadline is set', async () => {
    // Admin creates course without deadline
    const createRes = await authFetch('/api/courses', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Kurs bez terminu zapisow',
        capacity: 30,
      }),
    })
    expect(createRes.status).toBe(201)
    const course = await createRes.json()
    const courseId = course.id

    // Student enrolls successfully
    const enrollRes = await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId }),
    })

    expect(enrollRes.status).toBe(201)
  })
})

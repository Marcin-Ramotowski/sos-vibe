import { describe, it, expect, beforeAll } from 'vitest'

const BASE_URL = 'http://localhost:3111'

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

describe('Courses API', () => {
  let adminToken: string
  let studentToken: string

  beforeAll(async () => {
    adminToken = await login('admin@uni.pl', 'admin123')
    studentToken = await login('student@uni.pl', 'student123')
  })

  it('should list courses for admin', async () => {
    const res = await authFetch('/api/courses', adminToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data).toBeInstanceOf(Array)
    expect(data.pagination).toBeDefined()
  })

  it('should list courses with enrollment status for student', async () => {
    const res = await authFetch('/api/courses', studentToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    if (data.data.length > 0) {
      expect(data.data[0]).toHaveProperty('enrollmentStatus')
    }
  })

  it('should return 401 without token', async () => {
    const res = await fetch(`${BASE_URL}/api/courses`)
    expect(res.status).toBe(401)
  })

  it('should allow admin to create a course', async () => {
    const res = await authFetch('/api/courses', adminToken, {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Integration Course',
        description: 'Integration test',
        capacity: 10,
      }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe('Test Integration Course')
    expect(data.capacity).toBe(10)
  })

  it('should return 403 when student tries to create course', async () => {
    const res = await authFetch('/api/courses', studentToken, {
      method: 'POST',
      body: JSON.stringify({ name: 'Unauthorized Course', capacity: 10 }),
    })
    expect(res.status).toBe(403)
  })

  it('should return 422 for invalid course data', async () => {
    const res = await authFetch('/api/courses', adminToken, {
      method: 'POST',
      body: JSON.stringify({ name: '', capacity: -1 }),
    })
    expect(res.status).toBe(422)
  })

  it('should get a course by ID', async () => {
    // First get the list to get an ID
    const listRes = await authFetch('/api/courses', adminToken)
    const listData = await listRes.json()
    const courseId = listData.data[0]?.id
    if (!courseId) return

    const res = await authFetch(`/api/courses/${courseId}`, adminToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(courseId)
  })

  it('should return 404 for non-existent course', async () => {
    const res = await authFetch('/api/courses/00000000-0000-0000-0000-000000000000', adminToken)
    expect(res.status).toBe(404)
  })

  it('should paginate courses', async () => {
    const res = await authFetch('/api/courses?page=1&limit=2', adminToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.pagination.limit).toBe(2)
    expect(data.data.length).toBeLessThanOrEqual(2)
  })
})

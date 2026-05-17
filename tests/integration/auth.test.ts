import { describe, it, expect } from 'vitest'

const BASE_URL = 'http://localhost:3111'

async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/token=([^;]+)/)
  const token = match?.[1] ?? ''
  return { status: res.status, data, token }
}

describe('Auth API', () => {
  it('should return 422 on invalid email', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'password' }),
    })
    expect(res.status).toBe(422)
  })

  it('should return 401 on wrong credentials', async () => {
    const { status } = await login('admin@uni.pl', 'wrongpassword')
    expect(status).toBe(401)
  })

  it('should login admin successfully', async () => {
    const { status, data } = await login('admin@uni.pl', 'admin123')
    expect(status).toBe(200)
    expect(data.role).toBe('ADMIN')
    expect(data.email).toBe('admin@uni.pl')
  })

  it('should login student successfully', async () => {
    const { status, data } = await login('student@uni.pl', 'student123')
    expect(status).toBe(200)
    expect(data.role).toBe('STUDENT')
  })

  it('should login lecturer successfully', async () => {
    const { status, data } = await login('lecturer@uni.pl', 'lecturer123')
    expect(status).toBe(200)
    expect(data.role).toBe('LECTURER')
  })

  it('should return 401 for /api/auth/me without token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`)
    expect(res.status).toBe(401)
  })

  it('should return user data from /api/auth/me with token', async () => {
    const { token } = await login('admin@uni.pl', 'admin123')
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `token=${token}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.role).toBe('ADMIN')
  })

  it('should logout and clear cookie', async () => {
    const { token } = await login('admin@uni.pl', 'admin123')
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `token=${token}` },
    })
    expect(logoutRes.status).toBe(200)
  })

  it('should return 200 from health check', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.status).toBe('ok')
  })
})

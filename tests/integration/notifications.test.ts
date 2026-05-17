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

describe('Notifications API', () => {
  let adminToken: string
  let lecturerToken: string
  let studentToken: string
  let testCourseId: string
  let lecturerId: string
  let studentId: string

  beforeAll(async () => {
    adminToken = await login('admin@uni.pl', 'admin123')
    lecturerToken = await login('lecturer@uni.pl', 'lecturer123')
    studentToken = await login('student@uni.pl', 'student123')

    lecturerId = await getLecturerId(adminToken)
    studentId = await getStudentId(adminToken)

    // Create a fresh course for this test run
    const courseRes = await authFetch('/api/courses', adminToken, {
      method: 'POST',
      body: JSON.stringify({ name: `Notifications Test ${Date.now()}`, capacity: 10 }),
    })
    const courseData = await courseRes.json()
    testCourseId = courseData.id

    // Assign lecturer to course
    await authFetch(`/api/courses/${testCourseId}/lecturer`, adminToken, {
      method: 'PATCH',
      body: JSON.stringify({ lecturerId }),
    })

    // Enroll student — this should create a STUDENT_ENROLLED notification for lecturer
    await authFetch('/api/enrollments', studentToken, {
      method: 'POST',
      body: JSON.stringify({ courseId: testCourseId }),
    })
  })

  // [AC-011-2] Lecturer receives STUDENT_ENROLLED after student enrollment
  it('[AC-011-2] lecturer receives STUDENT_ENROLLED notification', async () => {
    const res = await authFetch('/api/notifications', lecturerToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    const notification = data.find(
      (n: { type: string; payload: { courseId: string } }) =>
        n.type === 'STUDENT_ENROLLED' && n.payload.courseId === testCourseId,
    )
    expect(notification).toBeDefined()
    expect(notification.readAt).toBeNull()
  })

  // [AC-011-1] Student receives GRADE_ASSIGNED after grade is assigned
  it('[AC-011-1] student receives GRADE_ASSIGNED notification after grade assignment', async () => {
    // Assign a grade
    const gradeRes = await authFetch(
      `/api/courses/${testCourseId}/students/${studentId}/grade`,
      lecturerToken,
      { method: 'PUT', body: JSON.stringify({ value: 4.5 }) },
    )
    expect(gradeRes.status).toBe(200)

    // Student should now have a GRADE_ASSIGNED notification
    const res = await authFetch('/api/notifications', studentToken)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    const notification = data.find(
      (n: { type: string; payload: { courseId: string; gradeValue: number } }) =>
        n.type === 'GRADE_ASSIGNED' && n.payload.courseId === testCourseId,
    )
    expect(notification).toBeDefined()
    expect(notification.readAt).toBeNull()
    expect(notification.payload.gradeValue).toBe(4.5)
  })

  // [AC-011-3] GET /api/notifications returns only unread notifications of the logged-in user
  it('[AC-011-3] returns only unread notifications for the current user', async () => {
    // Get student notifications
    const studentRes = await authFetch('/api/notifications', studentToken)
    const studentNotifications = await studentRes.json()
    expect(Array.isArray(studentNotifications)).toBe(true)

    // Get lecturer notifications
    const lecturerRes = await authFetch('/api/notifications', lecturerToken)
    const lecturerNotifications = await lecturerRes.json()
    expect(Array.isArray(lecturerNotifications)).toBe(true)

    // Student notifications should not contain lecturer's notifications (STUDENT_ENROLLED)
    const studentHasEnrolledNotif = studentNotifications.some(
      (n: { type: string }) => n.type === 'STUDENT_ENROLLED',
    )
    expect(studentHasEnrolledNotif).toBe(false)

    // Lecturer notifications should not contain student's notifications (GRADE_ASSIGNED)
    const lecturerHasGradeNotif = lecturerNotifications.some(
      (n: { type: string; userId: string }) => n.type === 'GRADE_ASSIGNED' && n.userId === studentId,
    )
    expect(lecturerHasGradeNotif).toBe(false)
  })

  // [AC-011-4] PUT /api/notifications/[id]/read marks notification as read
  it('[AC-011-4] marks notification as read and removes it from unread list', async () => {
    // Get student's unread notifications
    const before = await authFetch('/api/notifications', studentToken)
    const beforeData = await before.json()
    const gradeNotif = beforeData.find((n: { type: string }) => n.type === 'GRADE_ASSIGNED')
    expect(gradeNotif).toBeDefined()

    // Mark it as read
    const markRes = await authFetch(`/api/notifications/${gradeNotif.id}/read`, studentToken, {
      method: 'PUT',
    })
    expect(markRes.status).toBe(200)
    const markData = await markRes.json()
    expect(markData.readAt).not.toBeNull()

    // Verify it no longer appears in unread list
    const after = await authFetch('/api/notifications', studentToken)
    const afterData = await after.json()
    const stillUnread = afterData.find((n: { id: string }) => n.id === gradeNotif.id)
    expect(stillUnread).toBeUndefined()
  })

  it('returns 404 when trying to mark another user notification as read', async () => {
    // Get lecturer's STUDENT_ENROLLED notification
    const res = await authFetch('/api/notifications', lecturerToken)
    const data = await res.json()
    const lecturerNotif = data.find((n: { type: string }) => n.type === 'STUDENT_ENROLLED')
    expect(lecturerNotif).toBeDefined()

    // Try to mark it as read with student token — should 404
    const markRes = await authFetch(`/api/notifications/${lecturerNotif.id}/read`, studentToken, {
      method: 'PUT',
    })
    expect(markRes.status).toBe(404)
  })
})

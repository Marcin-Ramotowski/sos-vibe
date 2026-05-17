import { test, expect } from '@playwright/test'

// [AC-011-5] NavBar/Sidebar shows unread notification badge
test.describe('Notifications', () => {
  test('[AC-011-5] sidebar shows badge after student enrollment on lecturer course', async ({ page, request }) => {
    // Setup: login as admin to create course and get user IDs
    const adminLoginRes = await request.post('/api/auth/login', {
      data: { email: 'admin@uni.pl', password: 'admin123' },
    })
    expect(adminLoginRes.ok()).toBeTruthy()
    const adminCookie = (adminLoginRes.headers()['set-cookie'] ?? '').match(/token=([^;]+)/)?.[1] ?? ''

    // Get lecturer ID
    const usersRes = await request.get('/api/users?limit=100', {
      headers: { Cookie: `token=${adminCookie}` },
    })
    const usersData = await usersRes.json()
    const lecturer = usersData.data.find((u: { role: string }) => u.role === 'LECTURER')
    const lecturerId: string = lecturer?.id ?? ''

    // Create a course
    const courseRes = await request.post('/api/courses', {
      data: { name: `E2E Notif Test ${Date.now()}`, capacity: 10 },
      headers: { Cookie: `token=${adminCookie}` },
    })
    const courseData = await courseRes.json()
    const courseId: string = courseData.id

    // Assign lecturer
    await request.patch(`/api/courses/${courseId}/lecturer`, {
      data: { lecturerId },
      headers: { Cookie: `token=${adminCookie}` },
    })

    // Login as student and enroll — creates STUDENT_ENROLLED notification for lecturer
    const studentLoginRes = await request.post('/api/auth/login', {
      data: { email: 'student@uni.pl', password: 'student123' },
    })
    const studentCookie = (studentLoginRes.headers()['set-cookie'] ?? '').match(/token=([^;]+)/)?.[1] ?? ''

    await request.post('/api/enrollments', {
      data: { courseId },
      headers: { Cookie: `token=${studentCookie}` },
    })

    // Now login as lecturer via browser and check badge
    await page.goto('/login')
    await page.fill('input[type="email"]', 'lecturer@uni.pl')
    await page.fill('input[type="password"]', 'lecturer123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/lecturer\/courses/, { timeout: 5000 })

    // Wait for Sidebar to mount and fetch notifications
    await page.waitForTimeout(2000)

    // Badge (bell icon) should be visible with count >= 1
    const badge = page.locator('span[aria-label="Powiadomienia"]')
    await expect(badge).toBeVisible({ timeout: 5000 })

    // The sibling span (count badge) should show a number >= 1
    const countBadge = page.locator('span[aria-label="Powiadomienia"] + span')
    await expect(countBadge).toBeVisible()
    const countText = await countBadge.textContent()
    const count = parseInt(countText ?? '0', 10)
    expect(count).toBeGreaterThanOrEqual(1)
  })
})

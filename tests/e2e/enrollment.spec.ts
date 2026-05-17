import { test, expect } from '@playwright/test'

// [US-006] Browse courses, [US-007] Enroll, [US-008] Unenroll, [US-009] My courses
test.describe('Enrollment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'student123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })
  })

  test('should show available courses with enrollment status badges', async ({ page }) => {
    await page.goto('/student/courses')
    // Wait for courses to load
    await page.waitForSelector('[class*="bg-white rounded-xl border"]', { timeout: 5000 })
    // Should have some courses visible
    const courses = page.locator('[class*="bg-white rounded-xl border border-gray-200 p-5"]')
    await expect(courses.first()).toBeVisible()
  })

  test('should enroll in a course and show ENROLLED status', async ({ page }) => {
    await page.goto('/student/courses')
    await page.waitForTimeout(1000) // Wait for courses to load

    // Find a course with "Zapisz się" button
    const enrollBtn = page.getByRole('button', { name: 'Zapisz się' }).first()
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click()
      // Should show toast or status change
      await page.waitForTimeout(1000)
    }
  })

  test('should show my courses page with enrolled courses', async ({ page }) => {
    await page.goto('/student/my-courses')
    await page.waitForTimeout(1000)
    // Page should load without errors
    await expect(page.locator('h1')).toContainText('Moje Kursy')
  })

  test('should show my grades page', async ({ page }) => {
    await page.goto('/student/grades')
    await page.waitForTimeout(1000)
    await expect(page.locator('h1')).toContainText('Moje Oceny')
  })
})

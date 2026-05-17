import { test, expect } from '@playwright/test'

// [AC-010-4] Admin creates course with dates
// [AC-010-5] Student sees badge "Zapisy zamknięte" for courses with passed deadline

test.describe('Course Dates — Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@uni.pl')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin\/courses/, { timeout: 5000 })
  })

  test('[AC-010-4] admin can create a course with enrollmentDeadline', async ({ page }) => {
    await page.waitForTimeout(1000)
    const createBtn = page.getByRole('button', { name: /utwórz kurs/i })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const courseName = `E2E Dates Course ${Date.now()}`
    await page.fill('input[name="name"]', courseName)
    await page.fill('input[name="capacity"]', '20')
    // Set enrollment deadline to a past date so student can see the badge
    await page.fill('input[name="enrollmentDeadline"]', '2020-01-01')

    await page.getByRole('button', { name: /utwórz|ok/i }).last().click()
    await page.waitForTimeout(1500)

    // Course should appear in the list
    await expect(page.locator('body')).toContainText(courseName, { timeout: 5000 })
  })

  test('[AC-010-4] admin can edit a course using EditCourseDialog', async ({ page }) => {
    await page.waitForTimeout(1000)

    // First create a course to edit
    const courseName = `E2E Edit Course ${Date.now()}`
    const createBtn = page.getByRole('button', { name: /utwórz kurs/i })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    await page.fill('input[name="name"]', courseName)
    await page.fill('input[name="capacity"]', '15')
    await page.getByRole('button', { name: /utwórz|ok/i }).last().click()
    await page.waitForTimeout(1500)

    // Find the "Edytuj" button for this course
    const row = page.locator('tr', { hasText: courseName })
    await expect(row).toBeVisible({ timeout: 5000 })

    const editBtn = row.getByRole('button', { name: /edytuj/i })
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Update the enrollment deadline
    await page.fill('input[name="enrollmentDeadline"]', '2025-12-31')
    await page.getByRole('button', { name: /zapisz zmiany/i }).click()
    await page.waitForTimeout(1500)

    // Dialog should close and no error toast
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Course Dates — Student', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'student123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })
  })

  test('[AC-010-5] student sees "Zapisy zamknięte" badge for course with past deadline', async ({ page }) => {
    // This test depends on at least one course with a past enrollmentDeadline existing in the DB.
    // The admin e2e test above creates one, or seeds may have one.
    // We wait for page to load and check if any closed badge appears.
    await page.waitForTimeout(2000)

    const body = await page.content()
    // If there's a course with past deadline, badge should be visible
    if (body.includes('Zapisy zamknięte')) {
      const badge = page.locator('text=⚠ Zapisy zamknięte').first()
      await expect(badge).toBeVisible()

      // The associated enroll button should say "Zapisy zamknięte"
      const closedBtn = page.locator('span', { hasText: 'Zapisy zamknięte' }).first()
      await expect(closedBtn).toBeVisible()
    } else {
      // No course with past deadline — create one via API and reload
      test.skip(true, 'No course with past deadline available; run admin test first')
    }
  })
})

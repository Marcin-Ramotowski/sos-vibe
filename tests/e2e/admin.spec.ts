import { test, expect } from '@playwright/test'

// [US-003] Create course, [US-004] Assign lecturer, [US-005] Admin views, [US-013] User management
test.describe('Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@uni.pl')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin\/courses/, { timeout: 5000 })
  })

  test('admin courses page should load with course table', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Zarządzanie Kursami')
    await page.waitForTimeout(1500)
    // Should have table or empty state
    const body = await page.content()
    expect(body).not.toContain('Internal Server Error')
    expect(body).toMatch(/Kurs|Utwórz|Brak/)
  })

  test('admin should be able to open create course dialog', async ({ page }) => {
    await page.waitForTimeout(1000)
    // Find and click "Utwórz kurs" button
    const createBtn = page.getByRole('button', { name: /utwórz kurs/i })
    await expect(createBtn).toBeVisible()
    await createBtn.click()
    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('admin should be able to create a new course', async ({ page }) => {
    await page.waitForTimeout(1000)
    const createBtn = page.getByRole('button', { name: /utwórz kurs/i })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible()

    const courseName = `E2E Test Course ${Date.now()}`
    await page.fill('input[name="name"]', courseName)
    await page.fill('input[name="capacity"]', '25')

    await page.getByRole('button', { name: /utwórz|zapisz|ok/i }).last().click()
    await page.waitForTimeout(1500)

    // Course should appear in the list
    await expect(page.locator('body')).toContainText(courseName, { timeout: 5000 })
  })

  test('admin users page should load with user table', async ({ page }) => {
    await page.goto('/admin/users')
    await page.waitForTimeout(1500)
    await expect(page.locator('h1')).toContainText('Zarządzanie Użytkownikami')
    const body = await page.content()
    expect(body).not.toContain('Internal Server Error')
  })

  test('student cannot access admin pages', async ({ page }) => {
    // Login as student
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'student123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })

    // Try to access admin page
    await page.goto('/admin/courses')
    // Should be redirected away from admin
    await expect(page).not.toHaveURL(/\/admin\/courses/)
  })
})

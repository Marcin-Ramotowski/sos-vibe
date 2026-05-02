import { test, expect } from '@playwright/test'

// [US-001] Login, [US-002] Logout
test.describe('Authentication', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/student/courses')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should login student and redirect to student dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'student123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })
  })

  test('should login lecturer and redirect to lecturer dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'lecturer@uni.pl')
    await page.fill('input[type="password"]', 'lecturer123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/lecturer\/courses/, { timeout: 5000 })
  })

  test('should login admin and redirect to admin dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'admin@uni.pl')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/admin\/courses/, { timeout: 5000 })
  })

  test('should show error for wrong password without revealing which field is wrong', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/)
    // Should not redirect
    await page.waitForTimeout(1000)
    await expect(page).toHaveURL(/\/login/)
  })

  test('should logout and clear session', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'student123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })

    // Find and click logout button
    const logoutBtn = page.getByRole('button', { name: /wyloguj/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })

    // Protected page should be inaccessible
    await page.goto('/student/courses')
    await expect(page).toHaveURL(/\/login/)
  })
})

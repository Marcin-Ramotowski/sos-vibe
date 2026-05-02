import { test, expect } from '@playwright/test'

// [US-010] View students, [US-011] Grade student, [US-012] View grades
test.describe('Grades', () => {
  test('lecturer should see their courses list', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'lecturer@uni.pl')
    await page.fill('input[type="password"]', 'lecturer123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/lecturer\/courses/, { timeout: 5000 })

    await expect(page.locator('h1')).toContainText('Moje Kursy')
    await page.waitForTimeout(1000)
  })

  test('lecturer courses page should load and show course list or empty state', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'lecturer@uni.pl')
    await page.fill('input[type="password"]', 'lecturer123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/lecturer\/courses/, { timeout: 5000 })

    await page.waitForTimeout(1500)
    // Should either show courses or an empty state — not an error
    const body = await page.content()
    expect(body).not.toContain('Internal Server Error')
  })

  test('student grades page should show grades or empty state', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'student@uni.pl')
    await page.fill('input[type="password"]', 'student123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })

    await page.goto('/student/grades')
    await page.waitForTimeout(1000)
    await expect(page.locator('h1')).toContainText('Moje Oceny')

    const body = await page.content()
    expect(body).not.toContain('Internal Server Error')
  })
})

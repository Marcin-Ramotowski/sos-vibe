import { test, expect, type Page } from '@playwright/test'

const STATS_URL = '/lecturer/courses/seed-course-1/stats'

async function loginAs(page: Page, role: 'lecturer' | 'student' | 'admin') {
  const credentials = {
    lecturer: { email: 'lecturer@uni.pl', password: 'lecturer123' },
    student: { email: 'student@uni.pl', password: 'student123' },
    admin: { email: 'admin@uni.pl', password: 'admin123' },
  }
  const { email, password } = credentials[role]
  await page.goto('/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

test.describe('Course stats page', () => {
  test('[AC-002-5] strona statystyk jest dostępna dla wykładowcy kursu', async ({ page }) => {
    await loginAs(page, 'lecturer')
    await expect(page).toHaveURL(/\/lecturer\/courses/, { timeout: 5000 })

    await page.goto(STATS_URL)
    await page.waitForTimeout(1500)

    const body = await page.content()
    expect(body).not.toContain('Internal Server Error')
    // API returned a valid response — no auth error message
    expect(body).not.toContain('FORBIDDEN')
    await expect(page.locator('h1')).toContainText('Statystyki kursu')
  })

  test('[AC-002-5] student nie ma dostępu do statystyk kursu', async ({ page }) => {
    await loginAs(page, 'student')
    await expect(page).toHaveURL(/\/student\/courses/, { timeout: 5000 })

    await page.goto(STATS_URL)
    await page.waitForTimeout(1500)

    // API returns 403 — page shows error state, not the stats
    const body = await page.content()
    const hasStats = body.includes('Średnia') && body.includes('Mediana')
    expect(hasStats).toBe(false)
  })

  test('[AC-002-6] strona wyświetla średnią, medianę, rozkład ocen i procent zaliczonych', async ({
    page,
  }) => {
    await loginAs(page, 'lecturer')
    await expect(page).toHaveURL(/\/lecturer\/courses/, { timeout: 5000 })

    await page.goto(STATS_URL)
    await page.waitForTimeout(1500)

    await expect(page.locator('h1')).toContainText('Statystyki kursu')
    // Stat cards are present
    await expect(page.getByText('Średnia')).toBeVisible()
    await expect(page.getByText('Mediana')).toBeVisible()
    await expect(page.getByText('Zaliczonych')).toBeVisible()
    // Distribution section is present
    await expect(page.getByText('Rozkład ocen')).toBeVisible()
  })
})

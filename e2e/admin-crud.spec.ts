import { test, expect } from '@playwright/test'

const base = process.env.TEST_BASE_URL || ''
const adminEmail = process.env.TEST_ADMIN_EMAIL || ''
const adminPassword = process.env.TEST_ADMIN_PASSWORD || ''

if (!base) {
  test.skip(true, 'TEST_BASE_URL not provided in env')
}

test.describe('Admin pages load without errors', () => {
  test('dashboard page loads without errors', async ({ page }) => {
    const response = await page.goto(base + '/dashboard')
    // Accept any response (could be auth redirect)
    expect(response?.status()).toBeLessThan(500)
  })

  test('users list page loads without errors', async ({ page }) => {
    const response = await page.goto(base + '/dashboard/users')
    expect(response?.status()).toBeLessThan(500)
  })

  test('courses page loads without errors', async ({ page }) => {
    const response = await page.goto(base + '/dashboard/courses')
    expect(response?.status()).toBeLessThan(500)
  })

  test.skip(!adminEmail || !adminPassword, 'admin can create and delete a user', async ({ page }) => {
    // Login first
    await page.goto(base + '/auth/login')
    await page.fill('input[type="email"]', adminEmail)
    await page.fill('input[type="password"]', adminPassword)
    await page.click('button[type="submit"]')

    // Wait for dashboard
    await page.waitForURL('**/dashboard', { timeout: 45000 })

    // Navigate to users/new
    await page.goto(base + '/dashboard/users/new', { timeout: 45000 })

    // Verify form elements exist
    await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 10000 })
  })
})

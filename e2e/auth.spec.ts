import { test, expect } from '@playwright/test'

// Tests require these env vars: TEST_BASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
const base = process.env.TEST_BASE_URL || ''
const adminEmail = process.env.TEST_ADMIN_EMAIL || ''
const adminPassword = process.env.TEST_ADMIN_PASSWORD || ''

if (!base || !adminEmail || !adminPassword) {
  test.skip(true, 'E2E credentials not provided in env (TEST_BASE_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)')
}

test.describe('Auth and navbar flows', () => {
  test('admin can login and see dashboard and notifications', async ({ page }) => {
    await page.goto(base + '/auth/login')

    // fill email/password
    await page.fill('input[type="email"]', adminEmail)
    await page.fill('input[type="password"]', adminPassword)
    await page.click('button[type="submit"]')

    // wait for dashboard redirect
    await page.waitForURL('**/dashboard')
    await expect(page.locator('text=Panel de control')).toBeVisible({ timeout: 10000 })

    // navbar components
    await expect(page.locator('button[aria-label="notifications"]').first().or(page.locator('button:has(svg[data-icon="Bell"])'))).toBeVisible()
    await expect(page.locator('text=Mi Perfil').first()).toBeVisible()
  })
})

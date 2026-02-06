import { test, expect } from '@playwright/test'

const base = process.env.TEST_BASE_URL || ''
const adminEmail = process.env.TEST_ADMIN_EMAIL || ''
const adminPassword = process.env.TEST_ADMIN_PASSWORD || ''

if (!base || !adminEmail || !adminPassword) {
  test.skip(true, 'E2E credentials not provided')
}

test('admin can create and delete a user', async ({ page }) => {
  await page.goto(base + '/auth/login')
  await page.fill('input[type="email"]', adminEmail)
  await page.fill('input[type="password"]', adminPassword)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')

  await page.goto(base + '/dashboard/users/new')
  const unique = Date.now()
  await page.fill('input[placeholder*="correo"]', `test+${unique}@example.com`)
  await page.fill('input[placeholder*="Nombre"]', `Test User ${unique}`)
  await page.click('button:has-text("Crear Usuario")')

  // wait for redirect to users list
  await page.waitForURL('**/dashboard/users')
  await expect(page.locator('text=Test User')).toBeVisible()

  // delete the created user using the actions menu (best-effort)
  const row = page.locator('tr:has-text("Test User")')
  await row.locator('button[aria-label="menu"]').first().click().catch(() => {})
  await row.locator('text=Eliminar').first().click().catch(() => {})

  await expect(page.locator('text=Test User')).toHaveCount(0)
})

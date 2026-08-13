import { test, expect } from '@playwright/test'

const publicRoutes = [
  '/login',
  '/register',
  '/org-login',
  '/forgot-password',
  '/403',
  '/session-expired',
  '/network-error',
]

test.describe('public routes', () => {
  for (const path of publicRoutes) {
    test(`loads ${path}`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.ok() || response?.status() === 200 || response?.status() === 304).toBeTruthy()
      await expect(page.locator('body')).toBeVisible()
    })
  }
})

test.describe('API proxy', () => {
  test('backend health proxy answers', async ({ request }) => {
    const response = await request.get('/backend/api/health')
    expect([200, 503]).toContain(response.status())
    const body = await response.json()
    if (response.status() === 200) {
      expect(body.status).toBe('ok')
    } else {
      expect(body.code).toBe('API_UNREACHABLE')
    }
  })
})

test.describe('auth gates', () => {
  test('root redirects to login when signed out', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/login/, { timeout: 15000 })
  })

  test('dashboard redirects to login when signed out', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/login/, { timeout: 15000 })
  })
})

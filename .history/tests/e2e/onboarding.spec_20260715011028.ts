import { test, expect } from '@playwright/test'

test.describe('AssetFlow onboarding and workflow', () => {
  test('registers a new org and completes onboarding wizard', async ({ page, baseURL }) => {
    const timestamp = Date.now()
    const firstName = 'Chidi'
    const lastName = 'Okonkwo'
    const email = `admin-${timestamp}@okonkwo-holdings.test`
    const password = 'AdminPass123!'
    const orgName = `Okonkwo Holdings ${timestamp}`

    await page.context().clearCookies()
    await page.goto('/register')
    await expect(page).toHaveURL(/\/register$/)

    await page.fill('input[name="firstName"]', firstName)
    await page.fill('input[name="lastName"]', lastName)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="organizationName"]', orgName)
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 60000 }),
      page.click('button:has-text("Create Account")'),
    ])

    await expect(page.locator('text=Tell us about your organization')).toBeVisible({ timeout: 60000 })

    await page.click('button:has-text("Manufacturing")')
    await page.click('button:has-text("Multiple locations")')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Configure your accounting policy')).toBeVisible()
    await page.click('button:has-text("₦500,000")')
    await page.click('button:has-text("Straight Line")')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Set up your locations')).toBeVisible()
    await page.fill('input[placeholder="Branch 1 name"]', 'Lagos Head Office')
    await page.fill('input[placeholder="Code (e.g. HQ)"]', 'LHO')
    await page.click('button:has-text("Add another branch")')
    await page.fill('input[placeholder="Branch 2 name"]', 'Abuja Office')
    await page.fill('input[placeholder="Code (e.g. HQ)"]', 'ABJ')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Add your first assets')).toBeVisible()
    await page.click('button:has-text("Import from Excel")')

    await expect(page).toHaveURL(/\/assets\/import(?:\?|$)/, { timeout: 60000 })
    await expect(page.getByRole('heading', { name: 'Import your asset register' })).toBeVisible({ timeout: 60000 })

    // Post-onboarding coverage: verify dashboard and related pages
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: /^Good / })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Recent Assets' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Open Maintenance' })).toBeVisible()

    await page.goto('/branches')
    await expect(page).toHaveURL(/\/branches$/)
    await expect(page.getByRole('heading', { name: 'Branches' })).toBeVisible()

    await page.goto('/settings/team')
    await expect(page).toHaveURL(/\/settings\/team$/)
    await expect(page.getByRole('heading', { name: 'Team members' })).toBeVisible()

    await page.goto('/reports', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page).toHaveURL(/\/reports$/)
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Audit dashboard' })).toBeVisible()

    await page.goto('/reports/audit', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page).toHaveURL(/\/reports\/audit$/)
    await expect(page.getByRole('heading', { name: 'Audit dashboard' })).toBeVisible()

    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page).toHaveURL(/\/assets$/)
    await expect(page.getByRole('heading', { name: 'Assets' })).toBeVisible()
  })
})

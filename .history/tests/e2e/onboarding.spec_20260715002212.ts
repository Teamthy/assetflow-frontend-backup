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
    await page.click('button:has-text("Create Account")')

    await page.waitForURL('**/onboarding')
    await expect(page.locator('text=Tell us about your organization')).toBeVisible()

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
    await expect(page.locator('text=Import your asset register')).toBeVisible({ timeout: 60000 })

    // Post-onboarding coverage: verify dashboard and related pages
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.locator('text=Recent Assets')).toBeVisible()
    await expect(page.locator('text=Open Maintenance')).toBeVisible()

    await page.goto('/branches')
    await expect(page.locator('text=Branches')).toBeVisible()

    await page.goto('/settings/team')
    await expect(page.locator('text=Team members')).toBeVisible()

    await page.goto('/reports/audit')
    await expect(page.locator('text=Audit dashboard')).toBeVisible()
  })
})

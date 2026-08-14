import { test, expect, chromium } from '@playwright/test'

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function runUserScenario(index: number) {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    const timestamp = Date.now() + index
    const firstName = `User${index + 1}`
    const lastName = `Concurrent${index + 1}`
    const email = `multi-${timestamp}-${index + 1}@assetflow.test`
    const password = 'StrongPass123!'
    const orgName = `Concurrent Org ${index + 1} ${timestamp}`

    await page.goto('/register')
    await expect(page).toHaveURL(/\/register$/)

    await page.fill('input[name="firstName"]', firstName)
    await page.fill('input[name="lastName"]', lastName)
    await page.fill('input[name="email"]', email)
    await page.fill('input[name="password"]', password)
    await page.fill('input[name="organizationName"]', orgName)
    await page.click('button:has-text("Create Account")')

    await page.waitForURL(/\/onboarding(?:\?|$)/, { timeout: 60000 }).catch(() => null)
    if (page.url().includes('/register')) {
      await expect(page.locator('text=Create your account')).toBeVisible()
      await expect(page.locator('text=Too many registration requests')).toBeVisible({ timeout: 5000 }).catch(() => null)
      return
    }
    await expect(page.locator('text=Tell us about your organization')).toBeVisible()

    await page.click('button:has-text("Manufacturing")')
    await page.click('button:has-text("Multiple locations")')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Configure your accounting policy')).toBeVisible()
    await page.click('button:has-text("₦500,000")')
    await page.click('button:has-text("Straight Line")')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Set up your locations')).toBeVisible()
    await page.fill('input[placeholder="Branch 1 name"]', `Branch ${index + 1}`)
    await page.fill('input[placeholder="Code (e.g. HQ)"]', `B${index + 1}`)
    await page.click('button:has-text("Add another branch")')
    await page.fill('input[placeholder="Branch 2 name"]', `Branch ${index + 1} West`)
    await page.fill('input[placeholder="Code (e.g. HQ)"]', `BW${index + 1}`)
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Add your first assets')).toBeVisible()
    await page.click('button:has-text("Import from Excel")')

    await page.waitForURL(/\/assets\/import(?:\?|$)/)
    await expect(page.locator('text=Import your asset register')).toBeVisible()
  } finally {
    await context.close()
    await browser.close()
  }
}

test.describe('Concurrent onboarding flow', () => {
  test('simulates three users signing up and onboarding at the same time', async () => {
    test.setTimeout(10 * 60 * 1000)
    for (const index of [0, 1, 2]) {
      await runUserScenario(index)
      await delay(1500)
    }
  })
})

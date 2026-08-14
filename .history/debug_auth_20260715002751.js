const { chromium } = require('@playwright/test')
;(async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('http://localhost:3000/register')
  await page.fill('input[name="firstName"]', 'Debug')
  await page.fill('input[name="lastName"]', 'Test')
  const email = `debug-${Date.now()}@assetflow.test`
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', 'AdminPass123!')
  await page.fill('input[name="organizationName"]', 'Debug Org')
  await Promise.all([
    page.waitForURL(/\/onboarding/, { timeout: 60000 }),
    page.click('button:has-text("Create Account")'),
  ])
  console.log('onboarding url', page.url())
  console.log('storage auth', await page.evaluate(() => localStorage.getItem('assetflow-auth')))
  await page.click('button:has-text("Manufacturing")')
  await page.click('button:has-text("Multiple locations")')
  await page.click('button:has-text("Save and Continue")')
  await page.click('button:has-text("₦500,000")')
  await page.click('button:has-text("Straight Line")')
  await page.click('button:has-text("Save and Continue")')
  await page.fill('input[placeholder="Branch 1 name"]', 'Lagos Head Office')
  await page.fill('input[placeholder="Code (e.g. HQ)"]', 'LHO')
  await page.click('button:has-text("Add another branch")')
  await page.fill('input[placeholder="Branch 2 name"]', 'Abuja Office')
  await page.fill('input[placeholder="Code (e.g. HQ)"]', 'ABJ')
  await page.click('button:has-text("Save and Continue")')
  console.log('after branches url', page.url())
  await Promise.all([
    page.waitForURL(/\/assets\/import(?:\?|$)/, { timeout: 60000 }).catch((e) => { console.error('waitForURL error', e.message); return null }),
    page.click('button:has-text("Import from Excel")'),
  ])
  console.log('after click url', page.url())
  console.log('storage auth after click', await page.evaluate(() => localStorage.getItem('assetflow-auth')))
  console.log('cookies', await page.context().cookies())
  console.log('page content snippet', await page.content().then((html) => html.slice(0, 2000)))
  await page.screenshot({ path: 'debug-import-page.png', fullPage: true })
  await browser.close()
})().catch((err) => {
  console.error(err)
  process.exit(1)
})

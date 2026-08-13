import { test, expect } from '@playwright/test'

test.describe('register UI', () => {
  test('shows register form and validation', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
    await page.getByPlaceholder('First name').fill('Ada')
    await page.getByPlaceholder('Last name').fill('Eze')
    await page.getByPlaceholder('Email address').fill('ada@example.com')
    await page.getByPlaceholder('Password', { exact: true }).fill('AdminPass123!')
    await page.getByPlaceholder('Confirm password').fill('AdminPass123!')
    await page.getByPlaceholder('Organization name').fill('Eze Holdings')
    await expect(page.getByRole('button', { name: /create account/i })).toBeEnabled()
  })

  test('login form is wired', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in to assetflow/i })).toBeVisible()
    await page.getByPlaceholder('Email address').fill('ada@example.com')
    await page.getByPlaceholder('Password').fill('AdminPass123!')
    await expect(page.getByRole('button', { name: /login/i })).toBeEnabled()
  })
})

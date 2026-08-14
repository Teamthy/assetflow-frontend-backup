import { test, expect } from '@playwright/test'

const apiUrl = process.env.NEXT_PUBLIC_API_URL

function unwrapApiResult(raw: unknown) {
  if (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw) {
    return (raw as { data: unknown }).data
  }
  return raw
}

function extractInviteToken(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const payload = data as Record<string, unknown>
  const token = payload.inviteToken ?? payload.token ?? payload.invitationToken ?? payload.invite_code
  if (typeof token === 'string' && token.trim()) return token

  const link = payload.inviteLink ?? payload.invitationLink ?? payload.inviteUrl ?? payload.invitationUrl ?? payload.url
  if (typeof link === 'string') {
    const match = link.match(/\/([^/]+)$/)
    if (match) return match[1]
  }

  return undefined
}

function normalizeList(raw: unknown): Array<Record<string, unknown>> {
  const value = unwrapApiResult(raw)
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>
  if (value && typeof value === 'object') {
    const list = value as Record<string, unknown>
    if (Array.isArray(list.data)) return list.data as Array<Record<string, unknown>>
    if (Array.isArray(list.items)) return list.items as Array<Record<string, unknown>>
  }
  return []
}

async function getAccessTokenFromCookies(page: Parameters<typeof test.describe>[0] extends any ? any : any) {
  const cookies = await page.context().cookies()
  return cookies.find((cookie) => cookie.name === 'access-token')?.value ?? null
}

async function createInvitationToken(request: any, accessToken: string, inviteData: { email: string; firstName: string; lastName: string; role: string }) {
  if (!apiUrl) throw new Error('NEXT_PUBLIC_API_URL is not configured')

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
  const createResponse = await request.post(`${apiUrl}/invitations`, {
    data: inviteData,
    headers,
  })

  const createBody = unwrapApiResult(await createResponse.json().catch(() => null))
  let token = extractInviteToken(createBody)
  if (token) return token

  const candidatePaths = ['/settings/team/invitations', '/team/invitations']
  for (const path of candidatePaths) {
    const listResponse = await request.get(`${apiUrl}${path}`, { headers })
    const listBody = unwrapApiResult(await listResponse.json().catch(() => null))
    const items = normalizeList(listBody)
    const found = items.find((item) => item?.email === inviteData.email)
    token = extractInviteToken(found)
    if (token) return token
  }

  return undefined
}

async function acceptInvitationAndVerify(
  page: Parameters<typeof test.describe>[0] extends any ? any : any,
  inviteToken: string,
  firstName: string,
  lastName: string,
  expectedHeading: string,
  expectedRoleLabel: string,
) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.context().clearCookies()

  await page.goto(`/accept-invite/${inviteToken}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await expect(page.getByRole('heading', { name: 'Join AssetFlow' })).toBeVisible({ timeout: 60000 })
  await expect(page.locator(`text=as ${expectedRoleLabel}`)).toBeVisible({ timeout: 60000 })

  await page.fill('input[name="firstName"]', firstName)
  await page.fill('input[name="lastName"]', lastName)
  await page.fill('input[name="password"]', 'InvitePass123!')
  await page.fill('input[name="confirmPassword"]', 'InvitePass123!')

  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 60000 }),
    page.click('button:has-text("Accept and create account")'),
  ])

  await expect(page.getByRole('heading', { name: expectedHeading })).toBeVisible({ timeout: 60000 })
}

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
    await expect(page.getByRole('heading', { name: 'Assets', exact: true })).toBeVisible()
  })

  test('accepts invited staff and lands on a role-specific dashboard', async ({ page, request }) => {
    test.skip(!apiUrl, 'NEXT_PUBLIC_API_URL is not configured for invitation flow tests')

    const timestamp = Date.now()
    const adminFirstName = 'Ada'
    const adminLastName = 'Nwosu'
    const adminEmail = `admin-invite-${timestamp}@assetflow.test`
    const adminPassword = 'AdminInvite123!'
    const orgName = `Invite Org ${timestamp}`

    await page.context().clearCookies()
    await page.goto('/register')
    await expect(page).toHaveURL(/\/register$/)

    await page.fill('input[name="firstName"]', adminFirstName)
    await page.fill('input[name="lastName"]', adminLastName)
    await page.fill('input[name="email"]', adminEmail)
    await page.fill('input[name="password"]', adminPassword)
    await page.fill('input[name="organizationName"]', orgName)
    await Promise.all([
      page.waitForURL('**/onboarding', { timeout: 60000 }),
      page.click('button:has-text("Create Account")'),
    ])

    await expect(page.locator('text=Tell us about your organization')).toBeVisible({ timeout: 60000 })
    await page.click('button:has-text("Manufacturing")')
    await page.click('button:has-text("Multiple locations")')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Configure your accounting policy')).toBeVisible({ timeout: 60000 })
    await page.click('button:has-text("₦500,000")')
    await page.click('button:has-text("Straight Line")')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Set up your locations')).toBeVisible({ timeout: 60000 })
    await page.fill('input[placeholder="Branch 1 name"]', 'Lagos Head Office')
    await page.fill('input[placeholder="Code (e.g. HQ)"]', 'LHO')
    await page.click('button:has-text("Add another branch")')
    await page.fill('input[placeholder="Branch 2 name"]', 'Abuja Office')
    await page.fill('input[placeholder="Code (e.g. HQ)"]', 'ABJ')
    await page.click('button:has-text("Save and Continue")')

    await expect(page.locator('text=Add your first assets')).toBeVisible({ timeout: 60000 })
    await page.click('button:has-text("Import from Excel")')
    await expect(page).toHaveURL(/\/assets\/import(?:\?|$)/, { timeout: 60000 })

    const accessToken = await getAccessTokenFromCookies(page)
    expect(accessToken).toBeTruthy()

    const inviteRoles = [
      { role: 'branch_manager', label: 'Branch Manager', heading: 'Branch Overview' },
      { role: 'finance_user', label: 'Finance User', heading: 'Finance Dashboard' },
      { role: 'auditor', label: 'Auditor', heading: 'Audit Overview' },
    ]

    for (const inviteRole of inviteRoles) {
      const inviteEmail = `invite-${inviteRole.role}-${timestamp}@assetflow.test`
      const inviteToken = await createInvitationToken(request, accessToken!, {
        email: inviteEmail,
        firstName: 'Invited',
        lastName: inviteRole.label,
        role: inviteRole.role,
      })

      expect(inviteToken).toBeTruthy()
      await acceptInvitationAndVerify(page, inviteToken as string, 'Invited', inviteRole.label, inviteRole.heading, inviteRole.label)
    }
  })
})

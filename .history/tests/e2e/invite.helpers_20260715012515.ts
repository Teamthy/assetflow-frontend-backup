import type { APIRequestContext, Page } from '@playwright/test'

export const apiUrl = process.env.NEXT_PUBLIC_API_URL

export function unwrapApiResult(raw: unknown) {
  if (raw && typeof raw === 'object' && 'data' in raw && 'success' in raw) {
    return (raw as { data: unknown }).data
  }
  return raw
}

export function extractInviteToken(data: unknown): string | undefined {
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

export function normalizeList(raw: unknown): Array<Record<string, unknown>> {
  const value = unwrapApiResult(raw)
  if (Array.isArray(value)) return value as Array<Record<string, unknown>>
  if (value && typeof value === 'object') {
    const list = value as Record<string, unknown>
    if (Array.isArray(list.data)) return list.data as Array<Record<string, unknown>>
    if (Array.isArray(list.items)) return list.items as Array<Record<string, unknown>>
  }
  return []
}

export async function getAccessTokenFromCookies(page: Page) {
  const cookies = await page.context().cookies()
  return cookies.find((cookie) => cookie.name === 'access-token')?.value ?? null
}

export async function createInvitationToken(
  request: APIRequestContext,
  accessToken: string,
  inviteData: { email: string; firstName: string; lastName: string; role: string },
) {
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

export async function acceptInvitationAndVerify(
  page: Page,
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

export const inviteRoleFixtures = [
  { role: 'branch_manager', label: 'Branch Manager', heading: 'Branch Overview' },
  { role: 'finance_user', label: 'Finance User', heading: 'Finance Dashboard' },
  { role: 'auditor', label: 'Auditor', heading: 'Audit Overview' },
] as const

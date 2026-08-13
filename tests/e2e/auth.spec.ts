import { test, expect } from '@playwright/test'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:7000/api'

test.describe('auth API contract', () => {
  test('health is up', async ({ request }) => {
    const response = await request.get(`${apiUrl}/health`)
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  test('register login me and refresh', async ({ request }) => {
    const stamp = Date.now()
    const email = `e2e-${stamp}@assetflow.test`
    const password = 'AdminPass123!'

    const register = await request.post(`${apiUrl}/auth/register`, {
      data: {
        accountType: 'organization',
        firstName: 'Ada',
        lastName: 'Eze',
        email,
        password,
        organizationName: `E2E Org ${stamp}`,
      },
    })
    expect(register.ok()).toBeTruthy()
    const registered = await register.json()
    const data = registered.data
    expect(data.accessToken).toBeTruthy()
    expect(data.refreshToken).toBeTruthy()
    expect(data.role).toBeTruthy()
    expect(data.user.email).toBe(email)

    const login = await request.post(`${apiUrl}/auth/login`, {
      data: { email, password },
    })
    expect(login.ok()).toBeTruthy()
    const session = (await login.json()).data
    expect(session.accessToken).toBeTruthy()
    expect(session.refreshToken).toBeTruthy()

    const me = await request.get(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
    expect(me.ok()).toBeTruthy()
    const meBody = (await me.json()).data
    expect(meBody.user.email).toBe(email)
    expect(meBody.role).toBeTruthy()

    const refresh = await request.post(`${apiUrl}/auth/refresh-token`, {
      data: { refreshToken: session.refreshToken },
    })
    expect(refresh.ok()).toBeTruthy()
    const refreshed = (await refresh.json()).data
    expect(refreshed.accessToken).toBeTruthy()
    expect(refreshed.refreshToken).toBeTruthy()
  })
})

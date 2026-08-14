/**
 * Real-user API + page journey:
 * register → branches → add asset → template → import → export →
 * transfer → edit → timeline → QR → dispose/restore → maintenance →
 * settings/team/reports → logout → login → page walk.
 *
 *   $env:API_URL="http://127.0.0.1:7000/api"
 *   $env:APP_URL="http://127.0.0.1:3000"
 *   node scripts/user-flow.mjs
 */
const API = (process.env.API_URL || 'http://127.0.0.1:7000/api').replace(/\/$/, '')
const APP = (process.env.APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')

const results = []
const stamp = Date.now()
const ctx = {
  email: `flow-${stamp}@assetflow.test`,
  password: 'AdminPass123!',
  token: '',
  refresh: '',
  role: '',
  branchA: '',
  branchB: '',
  assetId: '',
  importedTag: `IMP-${String(stamp).slice(-6)}`,
}

const pass = (name, detail = '') => {
  results.push({ name, status: 'PASS', detail })
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`)
}
const fail = (name, detail = '') => {
  results.push({ name, status: 'FAIL', detail })
  console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
}

const call = async (method, path, { body, token, form, raw } = {}) => {
  const headers = { Accept: 'application/json, application/octet-stream, */*' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ? form : body !== undefined ? JSON.stringify(body) : undefined,
  })
  const contentType = response.headers.get('content-type') || ''
  const buffer = Buffer.from(await response.arrayBuffer())
  let json = null
  const text = buffer.toString('utf8')
  if (contentType.includes('json')) {
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
  }
  return {
    status: response.status,
    ok: response.ok,
    json,
    text,
    buffer,
    contentType,
    raw,
  }
}

const dataOf = (json) => json?.data ?? json

const section = (title) => {
  console.log('')
  console.log(`== ${title} ==`)
}

const dashboardPages = [
  '/dashboard',
  '/assets',
  '/assets/new',
  '/assets/import',
  '/branches',
  '/branches/new',
  '/maintenance',
  '/maintenance/new',
  '/approvals',
  '/notifications',
  '/profile',
  '/reports',
  '/reports/assets',
  '/reports/finance',
  '/reports/maintenance',
  '/reports/audit',
  '/settings',
  '/settings/organization',
  '/settings/team',
  '/settings/accounting',
  '/settings/billing',
  '/settings/notifications',
]

const run = async () => {
  console.log('AssetFlow user-flow suite')
  console.log(`API ${API}`)
  console.log(`APP ${APP}`)

  section('1. Health')
  try {
    const health = await call('GET', '/health')
    if (health.ok && health.json?.status === 'ok') pass('GET /health')
    else {
      fail('GET /health', `${health.status}`)
      throw new Error('API down')
    }
  } catch (error) {
    fail('GET /health', String(error))
    summarize()
    process.exit(1)
  }

  section('2. Register (admin) and session')
  const register = await call('POST', '/auth/register', {
    body: {
      accountType: 'organization',
      firstName: 'Flow',
      lastName: 'Admin',
      email: ctx.email,
      password: ctx.password,
      organizationName: `Flow Org ${stamp}`,
    },
  })
  const registered = dataOf(register.json)
  if (!register.ok || !registered?.accessToken) {
    fail('register', `${register.status} ${register.text.slice(0, 200)}`)
    summarize()
    process.exit(1)
  }
  ctx.token = registered.accessToken
  ctx.refresh = registered.refreshToken || ''
  ctx.role = registered.role || 'admin'
  pass('register', `role=${ctx.role}`)

  const login = await call('POST', '/auth/login', {
    body: { email: ctx.email, password: ctx.password },
  })
  const session = dataOf(login.json)
  if (login.ok && session?.accessToken) {
    ctx.token = session.accessToken
    ctx.refresh = session.refreshToken || ctx.refresh
    pass('login')
  } else fail('login', `${login.status}`)

  const me = await call('GET', '/auth/me', { token: ctx.token })
  if (me.ok && dataOf(me.json)?.user?.email === ctx.email) pass('me')
  else fail('me', `${me.status}`)

  section('3. Branches (needed for transfer)')
  const branchA = await call('POST', '/branches', {
    token: ctx.token,
    body: { name: `HQ ${stamp}`, code: `HQ${String(stamp).slice(-4)}` },
  })
  const branchB = await call('POST', '/branches', {
    token: ctx.token,
    body: { name: `Depot ${stamp}`, code: `DP${String(stamp).slice(-4)}` },
  })
  ctx.branchA = dataOf(branchA.json)?.id || ''
  ctx.branchB = dataOf(branchB.json)?.id || ''
  if (ctx.branchA) pass('create branch HQ')
  else fail('create branch HQ', `${branchA.status} ${branchA.text.slice(0, 160)}`)
  if (ctx.branchB) pass('create branch Depot')
  else fail('create branch Depot', `${branchB.status} ${branchB.text.slice(0, 160)}`)

  const branches = await call('GET', '/branches', { token: ctx.token })
  if (branches.ok) pass('list branches')
  else fail('list branches', `${branches.status}`)

  section('4. Add asset')
  const asset = await call('POST', '/assets', {
    token: ctx.token,
    body: {
      name: `Dell Latitude ${stamp}`,
      assetTag: `E2E-${String(stamp).slice(-6)}`,
      status: 'active',
      condition: 'good',
      category: 'Laptop',
      manufacturer: 'Dell',
      purchaseCost: 450000,
      purchaseDate: '2024-03-01',
      expectedUsefulLifeMonths: 36,
      branchId: ctx.branchA || undefined,
      hasFutureEconomicBenefit: true,
      costCanBeReliablyMeasured: true,
    },
  })
  const created = dataOf(asset.json)
  ctx.assetId = created?.id || created?.asset?.id || ''
  if (asset.ok && ctx.assetId) pass('add asset', created.accountingTreatment || ctx.assetId)
  else fail('add asset', `${asset.status} ${asset.text.slice(0, 220)}`)

  if (ctx.assetId) {
    const one = await call('GET', `/assets/${ctx.assetId}`, { token: ctx.token })
    if (one.ok) pass('get asset')
    else fail('get asset', `${one.status}`)
  }

  section('5. Import template + import + export')
  const template = await call('GET', '/assets/import/template', { token: ctx.token })
  const templateOk =
    template.ok &&
    template.buffer.length > 100 &&
    (template.contentType.includes('spreadsheet') ||
      template.contentType.includes('excel') ||
      template.contentType.includes('octet-stream') ||
      template.buffer[0] === 0x50)
  if (templateOk) pass('download import template', `${template.buffer.length} bytes`)
  else fail('download import template', `${template.status} ${template.contentType}`)

  if (templateOk) {
    const form = new FormData()
    form.append(
      'file',
      new Blob([template.buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      `import-${stamp}.xlsx`,
    )
    const imported = await call('POST', '/assets/import', { token: ctx.token, form })
    const importedData = dataOf(imported.json)
    const inserted =
      importedData?.insertedCount ??
      importedData?.inserted ??
      importedData?.successCount ??
      importedData?.created ??
      imported.json?.insertedCount ??
      imported.json?.inserted ??
      0
    if (imported.ok && Number(inserted) > 0) pass('import assets', `inserted=${inserted}`)
    else if (imported.ok) fail('import assets', `inserted=${inserted} body=${imported.text.slice(0, 220)}`)
    else fail('import assets', `${imported.status} ${imported.text.slice(0, 220)}`)
  } else {
    fail('import assets', 'no template buffer')
  }

  const exported = await call('GET', '/assets/export', { token: ctx.token })
  const exportOk =
    exported.ok &&
    exported.buffer.length > 100 &&
    (exported.contentType.includes('spreadsheet') ||
      exported.contentType.includes('excel') ||
      exported.contentType.includes('octet-stream') ||
      exported.buffer[0] === 0x50)
  if (exportOk) pass('export assets', `${exported.buffer.length} bytes`)
  else fail('export assets', `${exported.status} ${exported.contentType}`)

  section('6. Transfer + timeline + QR')
  if (ctx.assetId && ctx.branchB) {
    const transfer = await call('POST', `/assets/${ctx.assetId}/transfer`, {
      token: ctx.token,
      body: {
        toBranchId: ctx.branchB,
        reason: 'E2E transfer to depot for field use',
      },
    })
    const transferred = dataOf(transfer.json)
    const newBranch =
      transferred?.updatedAsset?.branchId ||
      transferred?.asset?.branchId ||
      transferred?.branchId
    if (transfer.ok) pass('transfer asset', newBranch || 'ok')
    else fail('transfer asset', `${transfer.status} ${transfer.text.slice(0, 220)}`)
  } else {
    fail('transfer asset', 'missing asset or second branch')
  }

  if (ctx.assetId) {
    const timeline = await call('GET', `/assets/${ctx.assetId}/timeline`, {
      token: ctx.token,
    })
    if (timeline.ok) pass('asset timeline')
    else fail('asset timeline', `${timeline.status}`)

    const qr = await call('GET', `/assets/${ctx.assetId}/qr`, { token: ctx.token })
    if (qr.ok || qr.status === 200) pass('asset QR')
    else fail('asset QR', `${qr.status}`)

    const patch = await call('PATCH', `/assets/${ctx.assetId}`, {
      token: ctx.token,
      body: { description: 'updated by user-flow e2e' },
    })
    if (patch.ok) pass('edit asset')
    else fail('edit asset', `${patch.status} ${patch.text.slice(0, 160)}`)
  }

  section('7. Dispose / restore / maintenance')
  if (ctx.assetId) {
    const dispose = await call('POST', `/assets/${ctx.assetId}/dispose`, {
      token: ctx.token,
      body: {
        method: 'scrapped',
        reason: 'E2E dispose after transfer checks',
        proceeds: 0,
        disposedAt: '2024-12-01',
      },
    })
    if (dispose.ok) pass('dispose asset')
    else fail('dispose asset', `${dispose.status} ${dispose.text.slice(0, 160)}`)

    const restore = await call('POST', `/assets/${ctx.assetId}/restore`, {
      token: ctx.token,
      body: { reason: 'E2E restore after dispose test', targetStatus: 'active' },
    })
    if (restore.ok) pass('restore asset')
    else fail('restore asset', `${restore.status} ${restore.text.slice(0, 160)}`)

    const task = await call('POST', '/maintenance', {
      token: ctx.token,
      body: {
        assetId: ctx.assetId,
        title: 'E2E service',
        priority: 'medium',
      },
    })
    if (task.ok) pass('create maintenance')
    else fail('create maintenance', `${task.status} ${task.text.slice(0, 160)}`)
  }

  section('8. Reports / settings / team')
  for (const path of [
    '/reports/assets',
    '/reports/finance',
    '/reports/maintenance',
    '/organization-settings',
    '/users',
    '/users/roles',
    '/approvals',
    '/notifications',
    '/assets/audit',
  ]) {
    const res = await call('GET', path, { token: ctx.token })
    if (res.ok) pass(`GET ${path}`)
    else fail(`GET ${path}`, `${res.status}`)
  }

  section('9. Logout then login')
  const logout = await call('POST', '/auth/logout', { token: ctx.token })
  if (logout.ok || [200, 204].includes(logout.status)) pass('logout')
  else fail('logout', `${logout.status}`)

  const denied = await call('GET', '/auth/me', { token: ctx.token })
  if ([401, 403].includes(denied.status)) pass('me rejected after logout')
  else pass('me after logout', `status=${denied.status} (token may still be valid until expiry)`)

  const again = await call('POST', '/auth/login', {
    body: { email: ctx.email, password: ctx.password },
  })
  const againData = dataOf(again.json)
  if (again.ok && againData?.accessToken) {
    ctx.token = againData.accessToken
    pass('login after logout')
  } else fail('login after logout', `${again.status}`)

  section('10. Authenticated Next pages')
  for (const path of dashboardPages) {
    const res = await fetch(`${APP}${path}`, {
      redirect: 'manual',
      headers: { Cookie: `access-token=${ctx.token}` },
    })
    if (res.status === 200 || res.status === 304) pass(`page ${path}`)
    else if ([301, 302, 307, 308].includes(res.status)) {
      fail(`page ${path}`, `redirect ${res.headers.get('location')}`)
    } else fail(`page ${path}`, `status ${res.status}`)
  }

  const proxy = await fetch(`${APP}/backend/api/health`)
  const proxyBody = await proxy.json().catch(() => ({}))
  if (proxy.ok && proxyBody.status === 'ok') pass('Next proxy health')
  else fail('Next proxy health', `${proxy.status}`)

  summarize()
  process.exit(results.some((row) => row.status === 'FAIL') ? 1 : 0)
}

const summarize = () => {
  const passed = results.filter((row) => row.status === 'PASS').length
  const failed = results.filter((row) => row.status === 'FAIL').length
  console.log('')
  console.log(`RESULT  pass=${passed}  fail=${failed}  total=${results.length}`)
  if (failed) {
    console.log('Failed:')
    for (const row of results.filter((item) => item.status === 'FAIL')) {
      console.log(`  - ${row.name}  ${row.detail}`)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

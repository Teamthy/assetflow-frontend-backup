import { NextRequest, NextResponse } from 'next/server'

const TARGET = (process.env.API_PROXY_TARGET || 'http://127.0.0.1:6000').replace(
  /\/$/,
  '',
)

const HOP_BY_HOP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params
  const targetUrl = `${TARGET}/${path.join('/')}${request.nextUrl.search}`

  const headers = new Headers()
  for (const key of ['authorization', 'content-type', 'accept', 'cookie']) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }

  try {
    const hasBody = request.method !== 'GET' && request.method !== 'HEAD'
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: 'no-store',
      redirect: 'manual',
    })

    const out = new Headers()
    upstream.headers.forEach((value, key) => {
      if (!HOP_BY_HOP.has(key.toLowerCase())) out.set(key, value)
    })

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: out,
    })
  } catch {
    return NextResponse.json(
      {
        success: false,
        code: 'API_UNREACHABLE',
        message: `Cannot reach the AssetFlow API at ${TARGET}. Open a second terminal in assetflowserver, run pnpm dev, and wait for "API running on port 6000". Then GET ${TARGET}/api/health must return {"status":"ok"}.`,
      },
      { status: 503 },
    )
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const PATCH = proxy
export const DELETE = proxy
export const OPTIONS = proxy

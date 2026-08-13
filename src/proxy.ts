import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/org-login',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/session-expired',
  '/account-suspended',
  '/403',
  '/network-error',
  '/plan-limit',
]

const AUTH_ROUTES = ['/login', '/register', '/org-login', '/forgot-password']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow Next.js internals and static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/backend') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('access-token')?.value
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (!token && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (token && isAuth) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

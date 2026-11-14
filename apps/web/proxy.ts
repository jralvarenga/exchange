import { getSessionCookie } from 'better-auth/cookies'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const PUBLIC_PATHS = new Set([
  '/forgot-password',
  '/login',
  '/reset-password',
  '/sign-up',
  '/verify-email',
])

/** Optimistically gates pages on the session cookie. Handlers verify the session. */
export function proxy(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname

  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  // Login and sign-up validate the session themselves. Redirecting those
  // pages on the cookie alone would loop with the dashboard when that
  // cookie is stale.
  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next()
  }

  if (getSessionCookie(request)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'A valid dashboard session is required.',
        },
      },
      { status: 401 }
    )
  }

  const login = new URL('/login', request.url)

  // Invitation links survive the sign-in step.
  if (pathname.startsWith('/invite/')) {
    login.searchParams.set('next', pathname)
  }

  return NextResponse.redirect(login)
}

export const config = {
  // Public assets such as `/icons/google.svg` load on the signed-out login page,
  // so they must never be redirected to `/login`.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/).*)'],
}

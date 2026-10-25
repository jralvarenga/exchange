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

  if (PUBLIC_PATHS.has(pathname)) {
    if (
      getSessionCookie(request) &&
      (pathname === '/login' || pathname === '/sign-up')
    ) {
      return NextResponse.redirect(new URL('/', request.url))
    }

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

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

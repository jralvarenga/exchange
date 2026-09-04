import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth/token'

/** Gates dashboard pages and APIs with a verified signed session. */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname
  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const isAuthenticated = await verifySessionToken(session)

  if (pathname === '/login') {
    return isAuthenticated
      ? NextResponse.redirect(new URL('/', request.url))
      : NextResponse.next()
  }

  if (isAuthenticated) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

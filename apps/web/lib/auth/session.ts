import { cookies } from 'next/headers'

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from '@/lib/auth/token'

/** Creates the dashboard session with strict host-only cookie attributes. */
export async function createSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, await createSessionToken(), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
    priority: 'high',
    sameSite: 'strict',
    secure: true,
  })
}

/** Deletes the dashboard session cookie. */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'strict',
    secure: true,
  })
}

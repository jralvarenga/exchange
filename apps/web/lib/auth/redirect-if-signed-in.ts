import 'server-only'

import { auth } from '@workspace/auth/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/** Sends a browser with a valid session from an auth page to `next` (the dashboard by default). */
export async function redirectIfSignedIn(next = '/'): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect(next)
  }
}

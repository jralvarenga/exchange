import 'server-only'

import { auth } from '@workspace/auth/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/** Sends a browser with a valid session from an auth page to the dashboard. */
export async function redirectIfSignedIn(): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect('/')
  }
}

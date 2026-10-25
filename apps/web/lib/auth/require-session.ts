import 'server-only'

import { auth } from '@workspace/auth/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/** Loads the Better Auth session or sends the browser to the login page. */
export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  return session
}

import { auth } from '@workspace/auth/server'
import { toNextJsHandler } from 'better-auth/next-js'

import { assertEnv } from '@/lib/env'

const handlers = toNextJsHandler(auth)

/**
 * Validates runtime env on the first request so `next build` can collect
 * this route without every secret being present at module load.
 */
function withEnv<Handler extends (...args: never[]) => unknown>(
  handler: Handler
): Handler {
  return ((...args: Parameters<Handler>) => {
    assertEnv()
    return handler(...args)
  }) as Handler
}

export const DELETE = withEnv(handlers.DELETE)
export const GET = withEnv(handlers.GET)
export const PATCH = withEnv(handlers.PATCH)
export const POST = withEnv(handlers.POST)
export const PUT = withEnv(handlers.PUT)

import 'server-only'

import { auth } from '@workspace/auth/server'
import { headers } from 'next/headers'
import { z } from 'zod'

import {
  AlpacaCredentialsError,
  markCredentialInvalid,
  resolveAlpacaClientOptions,
} from '@/lib/alpaca/credentials'
import type { AlpacaClientOptions } from '@/lib/alpaca/schemas'
import { AlpacaApiError } from './client'

interface ApiHandlerContext {
  alpaca: AlpacaClientOptions
}

type ApiHandler = (context: ApiHandlerContext) => Promise<unknown>

interface ApiErrorBody {
  error: {
    code: string
    details?: z.core.$ZodIssue[]
    message: string
    requestId?: string
  }
}

interface CreateApiResponseOptions {
  exposeAlpacaMessage?: boolean
}

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

/** Runs an API handler with the signed-in user's Alpaca credentials. */
export async function createApiResponse(
  handler: ApiHandler,
  options: CreateApiResponseOptions = {}
): Promise<Response> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    return createErrorResponse(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'A valid dashboard session is required.',
        },
      },
      401
    )
  }

  let environment: 'live' | 'paper' | undefined

  try {
    const alpaca = await resolveAlpacaClientOptions(session.user.id)
    environment = alpaca.environment
    const data = await handler({ alpaca })

    return Response.json(data, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    if (error instanceof AlpacaCredentialsError) {
      return credentialErrorResponse(error.code)
    }

    // Only 401 means the keys were rejected. Alpaca also returns 403 for
    // valid keys, e.g. insufficient buying power on an order.
    if (
      error instanceof AlpacaApiError &&
      error.status === 401 &&
      environment
    ) {
      await markCredentialInvalid({
        environment,
        userId: session.user.id,
      })

      return credentialErrorResponse('INVALID')
    }

    if (error instanceof AlpacaApiError) {
      const status = getAlpacaErrorStatus(error, options.exposeAlpacaMessage)

      return createErrorResponse(
        {
          error: {
            code: 'ALPACA_REQUEST_FAILED',
            message: options.exposeAlpacaMessage
              ? error.message
              : status === 404
                ? 'The requested Alpaca resource was not found.'
                : 'Unable to retrieve data from Alpaca.',
            requestId: error.requestId,
          },
        },
        status
      )
    }

    if (error instanceof z.ZodError) {
      return createErrorResponse(
        {
          error: {
            code: 'INVALID_ALPACA_RESPONSE',
            message: 'Alpaca returned data in an unexpected format.',
          },
        },
        502
      )
    }

    return createErrorResponse(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'The server could not complete the request.',
        },
      },
      500
    )
  }
}

/** Returns a client-safe response for invalid route parameters. */
export function createValidationErrorResponse(error: z.ZodError): Response {
  return createErrorResponse(
    {
      error: {
        code: 'INVALID_REQUEST',
        details: error.issues,
        message: 'The request parameters are invalid.',
      },
    },
    400
  )
}

/** Maps a missing or rejected Alpaca key pair to a 428 response. */
function credentialErrorResponse(code: 'INVALID' | 'MISSING'): Response {
  if (code === 'MISSING') {
    return createErrorResponse(
      {
        error: {
          code: 'ALPACA_CREDENTIALS_REQUIRED',
          message: 'Add Alpaca keys for the active environment to continue.',
        },
      },
      428
    )
  }

  return createErrorResponse(
    {
      error: {
        code: 'ALPACA_CREDENTIALS_INVALID',
        message: 'The Alpaca keys for the active environment were rejected.',
      },
    },
    428
  )
}

/** Creates a non-cacheable JSON error response. */
function createErrorResponse(body: ApiErrorBody, status: number): Response {
  return Response.json(body, {
    headers: PRIVATE_NO_STORE_HEADERS,
    status,
  })
}

/** Maps upstream Alpaca errors to safe application HTTP statuses. */
function getAlpacaErrorStatus(
  error: AlpacaApiError,
  exposeAlpacaMessage = false
): number {
  if (error.status === 404) {
    return 404
  }

  if (error.status === 429) {
    return 503
  }

  if (exposeAlpacaMessage && error.status >= 400 && error.status < 500) {
    return error.status
  }

  return 502
}

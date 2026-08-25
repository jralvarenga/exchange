import 'server-only'

import { z } from 'zod'

import { AlpacaApiError } from './client'

type ApiHandler = () => Promise<unknown>

interface ApiErrorBody {
  error: {
    code: string
    details?: z.core.$ZodIssue[]
    message: string
    requestId?: string
  }
}

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

/** Runs an API handler and converts known failures into safe JSON responses. */
export async function createApiResponse(
  handler: ApiHandler
): Promise<Response> {
  try {
    const data = await handler()

    return Response.json(data, { headers: PRIVATE_NO_STORE_HEADERS })
  } catch (error) {
    if (error instanceof AlpacaApiError) {
      const status = getAlpacaErrorStatus(error)

      return createErrorResponse(
        {
          error: {
            code: 'ALPACA_REQUEST_FAILED',
            message:
              status === 404
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

/** Creates a non-cacheable JSON error response. */
function createErrorResponse(body: ApiErrorBody, status: number): Response {
  return Response.json(body, {
    headers: PRIVATE_NO_STORE_HEADERS,
    status,
  })
}

/** Maps upstream Alpaca errors to safe application HTTP statuses. */
function getAlpacaErrorStatus(error: AlpacaApiError): number {
  if (error.status === 404) {
    return 404
  }

  if (error.status === 429) {
    return 503
  }

  return 502
}

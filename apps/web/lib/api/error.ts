import { z } from 'zod'

const apiErrorBodySchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string(),
  }),
})

/** Error thrown when an application API route rejects a browser request. */
export class ApiRequestError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
    this.status = status
  }
}

/** Reads a failed response into an error that keeps the server's stable code. */
export async function apiRequestErrorFrom(
  response: Response,
  fallback: string
): Promise<ApiRequestError> {
  const body = apiErrorBodySchema.safeParse(
    await response.json().catch(() => null)
  )

  return new ApiRequestError(
    body.success
      ? (body.data.error.code ?? 'REQUEST_FAILED')
      : 'REQUEST_FAILED',
    body.success ? body.data.error.message : fallback,
    response.status
  )
}

/** Parses a successful JSON response, or throws the route's error code. */
export async function parseApiJson<Schema extends z.ZodType>(
  response: Response,
  schema: Schema,
  fallback: string
): Promise<z.infer<Schema>> {
  if (!response.ok) {
    throw await apiRequestErrorFrom(response, fallback)
  }

  return schema.parse(await response.json())
}

type AlpacaCredentialRequestError = ApiRequestError & {
  code: 'ALPACA_CREDENTIALS_INVALID' | 'ALPACA_CREDENTIALS_REQUIRED'
}

/** Returns whether the dashboard should ask the user to fix Alpaca keys. */
export function isAlpacaCredentialError(
  error: unknown
): error is AlpacaCredentialRequestError {
  return (
    error instanceof ApiRequestError &&
    (error.code === 'ALPACA_CREDENTIALS_REQUIRED' ||
      error.code === 'ALPACA_CREDENTIALS_INVALID')
  )
}

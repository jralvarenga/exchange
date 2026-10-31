import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import {
  getAccountConfigurations,
  updateAccountConfigurations,
} from '@/lib/alpaca/trading'
import { updateAccountConfigurationsSchema } from '@/lib/alpaca/trading-schemas'

/** Returns the active account's trading configuration. */
export async function GET(): Promise<Response> {
  return createApiResponse(async function getConfigurations({ alpaca }) {
    return getAccountConfigurations(alpaca)
  })
}

/** Updates part of the active account's trading configuration. */
export async function PATCH(request: Request): Promise<Response> {
  const body = await request.json().catch(() => undefined)
  const changes = updateAccountConfigurationsSchema.safeParse(body)

  if (!changes.success) {
    return createValidationErrorResponse(changes.error)
  }

  return createApiResponse(
    async function saveConfigurations({ alpaca }) {
      return updateAccountConfigurations({ ...alpaca, changes: changes.data })
    },
    { exposeAlpacaMessage: true }
  )
}

import { z } from 'zod'

import {
  createApiResponse,
  createValidationErrorResponse,
} from '@/lib/alpaca/http'
import { replaceOrderRequestSchema } from '@/lib/alpaca/schemas'
import { cancelOrder, replaceOrder } from '@/lib/alpaca/trading'

interface Context {
  params: Promise<{ id: string }>
}

const paramsSchema = z.object({ id: z.string().min(1).max(64) })

/** Replaces an open order's price, quantity, or time in force. */
export async function PATCH(
  request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)
  const body = replaceOrderRequestSchema.safeParse(
    await request.json().catch(() => undefined)
  )

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  if (!body.success) {
    return createValidationErrorResponse(body.error)
  }

  return createApiResponse(
    async function submitReplacement({ alpaca }) {
      return replaceOrder({
        ...alpaca,
        changes: body.data,
        orderId: params.data.id,
      })
    },
    { exposeAlpacaMessage: true }
  )
}

/** Cancels one open order. */
export async function DELETE(
  _request: Request,
  context: Context
): Promise<Response> {
  const params = paramsSchema.safeParse(await context.params)

  if (!params.success) {
    return createValidationErrorResponse(params.error)
  }

  return createApiResponse(
    async function submitCancellation({ alpaca }) {
      await cancelOrder({ ...alpaca, orderId: params.data.id })

      return { canceled: true }
    },
    { exposeAlpacaMessage: true }
  )
}

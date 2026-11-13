import { z } from 'zod'

import { recordOrderEvent } from '@/lib/activity/record'
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
    async function submitReplacement({ actor, alpaca }) {
      const replacement = await replaceOrder({
        ...alpaca,
        changes: body.data,
        orderId: params.data.id,
      })
      await recordOrderEvent({
        actor,
        alpacaOrderId: params.data.id,
        details: { changes: body.data, replacementOrderId: replacement.id },
        replacementAlpacaOrderId: replacement.id,
        status: replacement.status,
        type: 'replaced',
      })

      return replacement
    },
    { exposeAlpacaMessage: true, trading: true }
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
    async function submitCancellation({ actor, alpaca }) {
      await cancelOrder({ ...alpaca, orderId: params.data.id })
      await recordOrderEvent({
        actor,
        alpacaOrderId: params.data.id,
        status: 'pending_cancel',
        type: 'canceled',
      })

      return { canceled: true }
    },
    { exposeAlpacaMessage: true, trading: true }
  )
}

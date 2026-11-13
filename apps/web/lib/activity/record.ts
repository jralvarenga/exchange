import 'server-only'

import {
  type ActivityActor,
  type ConnectionActor,
  findOrderByAlpacaId,
  insertActivityLog,
  insertOrder,
  insertOrderEvent,
  type OrderEventType,
  recordOrderReplacement,
  updateOrderStatus,
} from '@workspace/db/queries/activity'

import type { AccountOrder, CreateOrderRequest } from '@/lib/alpaca/schemas'

interface RecordActivityInput {
  action: ActivityAction
  actor: ActivityActor
  metadata?: Record<string, unknown>
  targetId?: string | null
  targetType?: string | null
}

interface RecordOrderPlacedInput {
  actor: ConnectionActor
  order: AccountOrder
  request?: CreateOrderRequest
  source: 'close_position' | 'ticket'
}

interface RecordOrderEventInput {
  actor: ActivityActor
  alpacaOrderId: string
  details?: Record<string, unknown>
  /** The id Alpaca gave a replaced order. The order follows it from now on. */
  replacementAlpacaOrderId?: string
  status?: string
  type: Exclude<OrderEventType, 'placed'>
}

/** Every action written to `activity_logs`. */
export type ActivityAction =
  | 'connection.added'
  | 'connection.default_changed'
  | 'connection.keys_replaced'
  | 'connection.removed'
  | 'connection.renamed'
  | 'connection.switched'
  | 'connection.tested'
  | 'deposit_address.removed'
  | 'deposit_address.saved'
  | 'invitation.revoked'
  | 'invitation.sent'
  | 'member.joined'
  | 'member.left'
  | 'member.removed'
  | 'member.role_changed'
  | 'orders.canceled_all'
  | 'positions.liquidated'
  | 'trading_settings.updated'
  | 'workspace.created'
  | 'workspace.renamed'
  | 'workspace.switched'

/**
 * Writes one activity log row. The action already happened, so a failed write
 * is reported to the server log and never fails the request.
 */
export async function recordActivity(
  input: RecordActivityInput
): Promise<void> {
  try {
    await insertActivityLog(input)
  } catch (error) {
    reportRecordFailure(input.action, error)
  }
}

/** Records an order Alpaca accepted, with the size and prices that were asked for. */
export async function recordOrderPlaced(
  input: RecordOrderPlacedInput
): Promise<void> {
  const { order, request } = input
  const notional =
    request?.quantityMode === 'notional' ? request.amount : order.notional

  try {
    await insertOrder({
      actor: input.actor,
      alpacaOrderId: order.id,
      assetClass: order.assetClass ?? request?.assetClass ?? null,
      clientOrderId: order.clientOrderId,
      limitPrice: order.limitPrice ?? request?.limitPrice ?? null,
      notional: notional ?? null,
      orderClass: order.orderClass ?? request?.orderClass ?? null,
      quantity:
        order.quantity ??
        (request?.quantityMode === 'qty' ? request.amount : null),
      side: order.side,
      source: input.source,
      status: order.status,
      stopPrice: order.stopPrice ?? request?.stopPrice ?? null,
      symbol: order.symbol,
      timeInForce: order.timeInForce,
      type: order.type,
    })
  } catch (error) {
    reportRecordFailure('order.placed', error)
  }
}

/** Records a replace or cancel and links it to the order when Exchange placed it. */
export async function recordOrderEvent(
  input: RecordOrderEventInput
): Promise<void> {
  try {
    const order = await findOrderByAlpacaId({
      alpacaOrderId: input.alpacaOrderId,
      workspaceId: input.actor.workspaceId,
    })

    // Only a replace moves the order to a new Alpaca id.
    if (order && input.type === 'replaced' && input.replacementAlpacaOrderId) {
      await recordOrderReplacement({
        actor: input.actor,
        details: input.details,
        fromAlpacaOrderId: input.alpacaOrderId,
        orderId: order.id,
        status: input.status ?? order.status,
        toAlpacaOrderId: input.replacementAlpacaOrderId,
      })

      return
    }

    await insertOrderEvent({
      actor: input.actor,
      alpacaOrderId: input.alpacaOrderId,
      details: input.details,
      orderId: order?.id ?? null,
      type: input.type,
    })

    if (order && input.status) {
      await updateOrderStatus({
        alpacaOrderId: input.alpacaOrderId,
        status: input.status,
        workspaceId: input.actor.workspaceId,
      })
    }
  } catch (error) {
    reportRecordFailure(`order.${input.type}`, error)
  }
}

/**
 * Logs which record failed with the error's name and Postgres SQLSTATE code.
 * The message is left out: database errors carry the query's bound values,
 * which can include emails and order details.
 */
function reportRecordFailure(action: string, error: unknown): void {
  const name = error instanceof Error ? error.name : 'UnknownError'
  const cause = error instanceof Error ? error.cause : undefined
  const code =
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof cause.code === 'string'
      ? cause.code
      : undefined

  console.error(
    `Activity "${action}" could not be recorded.`,
    code ? `${name} (${code})` : name
  )
}

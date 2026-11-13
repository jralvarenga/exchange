import { and, desc, eq } from 'drizzle-orm'

import { db } from '../client'
import { activityLogs, orderEvents, orders } from '../schema/activity'

export type OrderRow = typeof orders.$inferSelect
export type OrderEventRow = typeof orderEvents.$inferSelect
export type ActivityLogRow = typeof activityLogs.$inferSelect

export type OrderEventType = 'canceled' | 'placed' | 'replaced'

/** Who did something, where, and with which connection. */
export type ActivityActor = {
  connectionId: string | null
  connectionName: string | null
  environment: 'live' | 'paper' | null
  userId: string
  workspaceId: string
}

/** An actor acting through a connection, so its environment is known. */
export type ConnectionActor = ActivityActor & {
  environment: 'live' | 'paper'
}

interface InsertOrderInput {
  actor: ConnectionActor
  alpacaOrderId: string
  assetClass?: string | null
  clientOrderId?: string | null
  limitPrice?: string | null
  notional?: string | null
  orderClass?: string | null
  quantity?: string | null
  side: 'buy' | 'sell'
  source: 'close_position' | 'ticket'
  status: string
  stopPrice?: string | null
  symbol: string
  timeInForce?: string | null
  type: string
}

interface InsertOrderEventInput {
  actor: ActivityActor
  alpacaOrderId: string
  details?: Record<string, unknown>
  orderId?: string | null
  type: OrderEventType
}

interface InsertActivityLogInput {
  action: string
  actor: ActivityActor
  metadata?: Record<string, unknown>
  targetId?: string | null
  targetType?: string | null
}

interface UpdateOrderStatusInput {
  alpacaOrderId: string
  status: string
  workspaceId: string
}

interface ListRecentInput {
  limit: number
  workspaceId: string
}

/** Records an order placed through Exchange together with its `placed` event. */
export async function insertOrder(input: InsertOrderInput): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date()

  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(orders)
      .values({
        ...input.actor,
        alpacaOrderId: input.alpacaOrderId,
        assetClass: input.assetClass ?? null,
        clientOrderId: input.clientOrderId ?? null,
        createdAt: now,
        id,
        limitPrice: input.limitPrice || null,
        notional: input.notional || null,
        orderClass: input.orderClass ?? null,
        quantity: input.quantity || null,
        side: input.side,
        source: input.source,
        status: input.status,
        stopPrice: input.stopPrice || null,
        symbol: input.symbol,
        timeInForce: input.timeInForce ?? null,
        type: input.type,
        updatedAt: now,
      })
      .onConflictDoNothing({
        target: [orders.workspaceId, orders.alpacaOrderId],
      })
      .returning({ id: orders.id })

    // Already recorded, for example by a retried request: keep the first row.
    if (!inserted) {
      const [existing] = await tx
        .select({ id: orders.id })
        .from(orders)
        .where(
          and(
            eq(orders.workspaceId, input.actor.workspaceId),
            eq(orders.alpacaOrderId, input.alpacaOrderId)
          )
        )
        .limit(1)

      // The conflict means the row exists; not finding it is a real error.
      if (!existing) {
        throw new Error('The recorded order could not be found.')
      }

      return existing.id
    }

    await tx.insert(orderEvents).values({
      ...input.actor,
      alpacaOrderId: input.alpacaOrderId,
      createdAt: now,
      id: crypto.randomUUID(),
      orderId: inserted.id,
      type: 'placed',
    })

    return inserted.id
  })
}

/**
 * Records a replace: the `replaced` event and pointing the order at the id
 * Alpaca gave its replacement, together in one transaction, so later events
 * on the replacement (a cancel, say) still find the order Exchange placed.
 */
export async function recordOrderReplacement(input: {
  actor: ActivityActor
  details?: Record<string, unknown>
  fromAlpacaOrderId: string
  orderId: string
  status: string
  toAlpacaOrderId: string
}): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.insert(orderEvents).values({
      ...input.actor,
      alpacaOrderId: input.fromAlpacaOrderId,
      createdAt: new Date(),
      details: input.details,
      id: crypto.randomUUID(),
      orderId: input.orderId,
      type: 'replaced',
    })
    await tx
      .update(orders)
      .set({
        alpacaOrderId: input.toAlpacaOrderId,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.workspaceId, input.actor.workspaceId),
          eq(orders.alpacaOrderId, input.fromAlpacaOrderId)
        )
      )
  })
}

/** Finds the Exchange record of an Alpaca order in a workspace. */
export async function findOrderByAlpacaId(input: {
  alpacaOrderId: string
  workspaceId: string
}): Promise<OrderRow | undefined> {
  const [row] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.workspaceId, input.workspaceId),
        eq(orders.alpacaOrderId, input.alpacaOrderId)
      )
    )
    .limit(1)

  return row
}

/** Updates the last known Alpaca status of a recorded order. */
export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<void> {
  await db
    .update(orders)
    .set({ status: input.status, updatedAt: new Date() })
    .where(
      and(
        eq(orders.workspaceId, input.workspaceId),
        eq(orders.alpacaOrderId, input.alpacaOrderId)
      )
    )
}

/** Records a change to an order after it was placed. */
export async function insertOrderEvent(
  input: InsertOrderEventInput
): Promise<void> {
  await db.insert(orderEvents).values({
    ...input.actor,
    alpacaOrderId: input.alpacaOrderId,
    createdAt: new Date(),
    details: input.details,
    id: crypto.randomUUID(),
    orderId: input.orderId ?? null,
    type: input.type,
  })
}

/** Records any other movement or change in a workspace. */
export async function insertActivityLog(
  input: InsertActivityLogInput
): Promise<void> {
  await db.insert(activityLogs).values({
    ...input.actor,
    action: input.action,
    createdAt: new Date(),
    id: crypto.randomUUID(),
    metadata: input.metadata,
    targetId: input.targetId ?? null,
    targetType: input.targetType ?? null,
  })
}

/** Lists a workspace's most recent order events with the order they belong to. */
export async function listRecentOrderEvents(
  input: ListRecentInput
): Promise<(OrderEventRow & { order: OrderRow | null })[]> {
  const rows = await db
    .select({ event: orderEvents, order: orders })
    .from(orderEvents)
    .leftJoin(orders, eq(orders.id, orderEvents.orderId))
    .where(eq(orderEvents.workspaceId, input.workspaceId))
    .orderBy(desc(orderEvents.createdAt))
    .limit(input.limit)

  return rows.map((row) => ({ ...row.event, order: row.order }))
}

/** Lists a workspace's most recent activity log entries. */
export async function listRecentActivityLogs(
  input: ListRecentInput
): Promise<ActivityLogRow[]> {
  return db
    .select()
    .from(activityLogs)
    .where(eq(activityLogs.workspaceId, input.workspaceId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(input.limit)
}

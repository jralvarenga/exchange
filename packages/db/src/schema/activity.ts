import { sql } from 'drizzle-orm'
import {
  check,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { alpacaConnections } from './alpaca-connections'
import { users } from './auth'
import { workspaces } from './workspaces'

/**
 * Columns every activity row carries: who did it, in which workspace, and with
 * which connection. The connection's name and environment are copied so the
 * record still reads correctly after the connection is renamed or removed.
 */
function actorColumns() {
  return {
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text().references(() => users.id, { onDelete: 'set null' }),
    connectionId: text().references(() => alpacaConnections.id, {
      onDelete: 'set null',
    }),
    connectionName: text(),
    environment: text(),
  }
}

/** Every buy or sell order placed through Treid, one row per Alpaca order. */
export const orders = pgTable(
  'orders',
  {
    id: text().primaryKey(),
    ...actorColumns(),
    alpacaOrderId: text().notNull(),
    clientOrderId: text(),
    symbol: text().notNull(),
    assetClass: text(),
    side: text().notNull(),
    type: text().notNull(),
    orderClass: text(),
    timeInForce: text(),
    quantity: numeric(),
    notional: numeric(),
    limitPrice: numeric(),
    stopPrice: numeric(),
    status: text().notNull(),
    // Every order is placed through a connection, so it always has one.
    environment: text().notNull(),
    source: text().notNull().default('ticket'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_workspace_created_idx').on(
      table.workspaceId,
      table.createdAt
    ),
    index('orders_user_idx').on(table.userId),
    index('orders_connection_idx').on(table.connectionId),
    // One row per Alpaca order per workspace, so a retried record is a no-op.
    uniqueIndex('orders_workspace_alpaca_order_unique').on(
      table.workspaceId,
      table.alpacaOrderId
    ),
    check('orders_side_check', sql`${table.side} in ('buy', 'sell')`),
    check(
      'orders_source_check',
      sql`${table.source} in ('ticket', 'close_position')`
    ),
    check(
      'orders_environment_check',
      sql`${table.environment} in ('paper', 'live')`
    ),
  ]
)

/**
 * An order's lifecycle as seen from Treid: placed, replaced or canceled.
 * `orderId` is null when the order was placed outside Treid.
 */
export const orderEvents = pgTable(
  'order_events',
  {
    id: text().primaryKey(),
    ...actorColumns(),
    orderId: text().references(() => orders.id, { onDelete: 'set null' }),
    alpacaOrderId: text().notNull(),
    type: text().notNull(),
    details: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('order_events_workspace_created_idx').on(
      table.workspaceId,
      table.createdAt
    ),
    index('order_events_alpaca_order_idx').on(table.alpacaOrderId),
    index('order_events_user_idx').on(table.userId),
    index('order_events_connection_idx').on(table.connectionId),
    index('order_events_order_idx').on(table.orderId),
    check(
      'order_events_type_check',
      sql`${table.type} in ('placed', 'replaced', 'canceled')`
    ),
  ]
)

/**
 * Every other movement or change: bulk cancels, liquidations, connection and
 * member changes, deposit addresses and workspace switches.
 */
export const activityLogs = pgTable(
  'activity_logs',
  {
    id: text().primaryKey(),
    ...actorColumns(),
    action: text().notNull(),
    targetType: text(),
    targetId: text(),
    metadata: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('activity_logs_workspace_created_idx').on(
      table.workspaceId,
      table.createdAt
    ),
    index('activity_logs_user_idx').on(table.userId),
    index('activity_logs_connection_idx').on(table.connectionId),
  ]
)

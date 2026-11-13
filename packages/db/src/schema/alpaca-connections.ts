import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { users } from './auth'
import { workspaces } from './workspaces'

/**
 * A named, encrypted Alpaca key pair owned by a workspace ("Main paper", "Live IRA").
 * Keys stay when the member who added them leaves.
 */
export const alpacaConnections = pgTable(
  'alpaca_connections',
  {
    id: text().primaryKey(),
    workspaceId: text()
      .notNull()
      .references((): AnyPgColumn => workspaces.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    environment: text().notNull(),
    keyIdCiphertext: text().notNull(),
    secretCiphertext: text().notNull(),
    keyIdLast4: text().notNull(),
    status: text().notNull().default('unverified'),
    lastVerifiedAt: timestamp({ withTimezone: true }),
    createdByUserId: text().references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('alpaca_connections_workspace_name_unique').on(
      table.workspaceId,
      sql`lower(${table.name})`
    ),
    index('alpaca_connections_workspace_idx').on(table.workspaceId),
    check(
      'alpaca_connections_environment_check',
      sql`${table.environment} in ('paper', 'live')`
    ),
    check(
      'alpaca_connections_status_check',
      sql`${table.status} in ('unverified', 'valid', 'invalid')`
    ),
    check(
      'alpaca_connections_key_id_last4_check',
      sql`char_length(${table.keyIdLast4}) = 4`
    ),
    check(
      'alpaca_connections_name_check',
      sql`char_length(${table.name}) between 1 and 40`
    ),
  ]
)

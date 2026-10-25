import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { users } from './auth'

/** Encrypted Alpaca key pairs. One row per user and trading environment. */
export const alpacaCredentials = pgTable(
  'alpaca_credentials',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    environment: text().notNull(),
    keyIdCiphertext: text().notNull(),
    secretCiphertext: text().notNull(),
    keyIdLast4: text().notNull(),
    status: text().notNull().default('unverified'),
    lastVerifiedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('alpaca_credentials_user_environment_unique').on(
      table.userId,
      table.environment
    ),
    check(
      'alpaca_credentials_environment_check',
      sql`${table.environment} in ('paper', 'live')`
    ),
    check(
      'alpaca_credentials_status_check',
      sql`${table.status} in ('unverified', 'valid', 'invalid')`
    ),
    check(
      'alpaca_credentials_key_id_last4_check',
      sql`char_length(${table.keyIdLast4}) = 4`
    ),
  ]
)

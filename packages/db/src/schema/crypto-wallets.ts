import { sql } from 'drizzle-orm'
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { users } from './auth'

/** Alpaca crypto deposit addresses. One row per user, network, and stablecoin. */
export const cryptoWallets = pgTable(
  'crypto_wallets',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chain: text().notNull(),
    asset: text().notNull(),
    address: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('crypto_wallets_user_chain_asset_unique').on(
      table.userId,
      table.chain,
      table.asset
    ),
    check(
      'crypto_wallets_chain_check',
      sql`${table.chain} in ('ethereum', 'solana')`
    ),
    check(
      'crypto_wallets_asset_check',
      sql`${table.asset} in ('USDC', 'USDT')`
    ),
  ]
)

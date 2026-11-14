import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { users } from './auth'
import { workspaces } from './workspaces'

/**
 * A stored secret box: `<version>:<keyId>:<iv>:<tag>:<ciphertext>`, base64url
 * parts, a 12-byte IV and a 16-byte tag. A raw Alpaca key never matches.
 */
const SECRET_BOX_PATTERN =
  '^v[0-9]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$'

/**
 * True when the member set by `withMemberScope` belongs to the row's workspace.
 * Plain SQL: `workspaces.ts` imports this file, so its tables may not exist yet.
 */
const memberOfRowWorkspace = sql`exists (
  select 1 from workspace_members m
  where m.workspace_id = alpaca_connections.workspace_id
    and m.user_id = current_setting('app.user_id', true)
)`

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
    // Target of the same-workspace foreign keys from members and workspaces.
    uniqueIndex('alpaca_connections_workspace_id_unique').on(
      table.workspaceId,
      table.id
    ),
    check(
      'alpaca_connections_key_id_ciphertext_format',
      sql`${table.keyIdCiphertext} ~ ${sql.raw(`'${SECRET_BOX_PATTERN}'`)}`
    ),
    check(
      'alpaca_connections_secret_ciphertext_format',
      sql`${table.secretCiphertext} ~ ${sql.raw(`'${SECRET_BOX_PATTERN}'`)}`
    ),
    check(
      'alpaca_connections_ciphertexts_distinct',
      sql`${table.keyIdCiphertext} <> ${table.secretCiphertext}`
    ),
    check(
      'alpaca_connections_key_id_last4_charset',
      sql`${table.keyIdLast4} ~ '^[A-Za-z0-9]{4}$'`
    ),
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
    // Row-level security: a role that does not own the table only sees and
    // changes connections of workspaces the acting member belongs to. The
    // member comes from `withMemberScope`. With no member set, nothing matches.
    // The owner (migrations, scripts, read_alpaca_credentials) is not subject.
    // Roles and permissions stay in packages/auth/src/access.ts.
    pgPolicy('alpaca_connections_member_access', {
      as: 'permissive',
      for: 'all',
      using: memberOfRowWorkspace,
      withCheck: memberOfRowWorkspace,
    }),
  ]
)

/**
 * Who used a connection's keys, how, and when. One row per connection, user
 * and purpose. Written only by `read_alpaca_credentials` (SECURITY DEFINER in
 * `0005_credential_hardening.sql`), never by application queries.
 */
export const alpacaCredentialUses = pgTable(
  'alpaca_credential_uses',
  {
    id: text().primaryKey(),
    connectionId: text()
      .notNull()
      .references(() => alpacaConnections.id, { onDelete: 'cascade' }),
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text().references(() => users.id, { onDelete: 'set null' }),
    purpose: text().notNull(),
    useCount: integer().notNull().default(1),
    firstUsedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('alpaca_credential_uses_connection_user_purpose_unique').on(
      table.connectionId,
      table.userId,
      table.purpose
    ),
    index('alpaca_credential_uses_workspace_idx').on(table.workspaceId),
    check(
      'alpaca_credential_uses_purpose_check',
      sql`${table.purpose} in ('read', 'trade', 'test')`
    ),
  ]
)

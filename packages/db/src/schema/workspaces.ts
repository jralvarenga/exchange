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

import { alpacaConnections } from './alpaca-connections'
import { users } from './auth'

/**
 * A shared trading setup. Every user gets one on sign-up and can join others.
 * The default connection is what members trade with until they pick another.
 */
export const workspaces = pgTable('workspaces', {
  id: text().primaryKey(),
  name: text().notNull(),
  defaultConnectionId: text().references(
    (): AnyPgColumn => alpacaConnections.id,
    { onDelete: 'set null' }
  ),
  createdByUserId: text().references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

/**
 * One user's membership in a workspace.
 * `activeConnectionId` is that member's own pick and wins over the default.
 */
export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: text().primaryKey(),
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text().notNull().default('member'),
    activeConnectionId: text().references(
      (): AnyPgColumn => alpacaConnections.id,
      { onDelete: 'set null' }
    ),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('workspace_members_workspace_user_unique').on(
      table.workspaceId,
      table.userId
    ),
    index('workspace_members_user_idx').on(table.userId),
    check(
      'workspace_members_role_check',
      sql`${table.role} in ('owner', 'member', 'viewer')`
    ),
  ]
)

/**
 * A pending invitation to join a workspace. Only the token's SHA-256 is stored.
 */
export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: text().primaryKey(),
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    role: text().notNull().default('member'),
    tokenHash: text().notNull().unique(),
    invitedByUserId: text().references(() => users.id, {
      onDelete: 'set null',
    }),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    acceptedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('workspace_invitations_workspace_idx').on(table.workspaceId),
    index('workspace_invitations_email_idx').on(table.email),
    check(
      'workspace_invitations_role_check',
      sql`${table.role} in ('owner', 'member', 'viewer')`
    ),
  ]
)

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

import { workspaceRoles } from '../workspace-roles'
import { alpacaConnections } from './alpaca-connections'
import { users } from './auth'

/**
 * A shared trading setup someone creates or is invited into. Sign-up does not
 * create one; onboarding does. The default connection is what members trade
 * with until they pick another.
 *
 * Last-owner and last-workspace protection lives in
 * `0004_better_auth_workspaces.sql` (`workspace_exit_guards` and the
 * `require_*` triggers). Those objects are listed in `src/sql-extras.ts`
 * and are not declared here so `db:generate` does not emit a second
 * CREATE TABLE.
 */
export const workspaces = pgTable('workspaces', {
  id: text().primaryKey(),
  name: text().notNull(),
  // Backfilled from existing IDs; the default keeps legacy inserts valid.
  slug: text().notNull().unique().default(sql`gen_random_uuid()::text`),
  logo: text(),
  metadata: text(),
  defaultConnectionId: text().references(
    (): AnyPgColumn => alpacaConnections.id,
    { onDelete: 'set null' }
  ),
  createdByUserId: text().references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
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
    role: text({ enum: workspaceRoles }).notNull().default('member'),
    activeConnectionId: text().references(
      (): AnyPgColumn => alpacaConnections.id,
      { onDelete: 'set null' }
    ),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('workspace_members_workspace_user_unique').on(
      table.workspaceId,
      table.userId
    ),
    index('workspace_members_user_idx').on(table.userId),
    check(
      'workspace_members_role_check',
      sql`${table.role} in ('owner', 'admin', 'member', 'paper_member', 'viewer')`
    ),
  ]
)

/**
 * A Better Auth invitation. Legacy token hashes remain valid after migration.
 */
export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: text().primaryKey(),
    workspaceId: text()
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    role: text({ enum: workspaceRoles }).notNull().default('member'),
    // Kept for invitation links emailed before the Better Auth migration.
    tokenHash: text().unique(),
    status: text({ enum: ['pending', 'accepted', 'rejected', 'canceled'] })
      .notNull()
      .default('pending'),
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
      'workspace_invitations_status_check',
      sql`${table.status} in ('pending', 'accepted', 'rejected', 'canceled')`
    ),
    // At most one pending invitation per address; closed invitations are history.
    uniqueIndex('workspace_invitations_pending_unique')
      .on(table.workspaceId, table.email)
      .where(sql`${table.status} = 'pending'`),
    check(
      'workspace_invitations_role_check',
      sql`${table.role} in ('owner', 'admin', 'member', 'paper_member', 'viewer')`
    ),
  ]
)

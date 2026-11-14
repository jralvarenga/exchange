/**
 * Database objects created only in `0004_better_auth_workspaces.sql`.
 * They are not Drizzle tables: adding `workspace_exit_guards` to `src/schema`
 * would make `db:generate` emit a CREATE TABLE that fails on databases that
 * already ran 0004. `db:check` therefore cannot see these objects.
 *
 * Keep this list in the migrate integration test so a fresh database still
 * has the last-owner, last-workspace, and invitation-status guards.
 */
export const workspaceSqlExtras = {
  functions: [
    'require_workspace_on_self_exit',
    'require_workspace_owner',
    'sync_workspace_invitation_status',
  ],
  table: 'workspace_exit_guards',
  triggers: [
    'workspace_invitation_status_sync',
    'workspace_requires_membership_on_self_exit',
    'workspace_requires_owner',
  ],
} as const

/**
 * Credential guards created only in hand-written SQL (`0005` and `0007`): the
 * binding lock and v2-on-write triggers, the same-workspace foreign keys
 * (Drizzle cannot emit `ON DELETE` for part of a composite key), and the
 * audited reader.
 */
export const credentialSqlExtras = {
  constraints: [
    'workspace_members_active_connection_same_workspace',
    'workspaces_default_connection_same_workspace',
  ],
  functions: [
    'alpaca_connections_lock_binding',
    'alpaca_connections_require_current_box',
    'read_alpaca_credentials',
  ],
  triggers: [
    'alpaca_connections_lock_binding',
    'alpaca_connections_require_current_box',
  ],
} as const

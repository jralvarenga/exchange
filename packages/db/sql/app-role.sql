-- Restricted runtime role for the web app. Run once per database as the
-- migrator (the role that owns the tables), after `db:migrate`:
--
--   psql "$DATABASE_MIGRATOR_URL" -v app_role=treid_app -f packages/db/sql/app-role.sql
--
-- Create the role and its password first (on Neon: console or API), then point
-- the app's DATABASE_URL at it and drizzle-kit's DATABASE_MIGRATOR_URL at the owner.
-- Column privileges never apply to a table owner, so the app must not own tables.
--
-- Result: the app can use every table, but cannot SELECT the two ciphertext
-- columns of alpaca_connections. Its only way to them is
-- read_alpaca_credentials(), which checks membership and records each use in
-- alpaca_credential_uses, a table the app can read but not write.
-- Row-level security on alpaca_connections (0006) also applies to this role:
-- it sees only rows of workspaces the member set by withMemberScope belongs to.
-- Rerun after each migration that adds a table.

\set ON_ERROR_STOP on

GRANT USAGE ON SCHEMA public TO :"app_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :"app_role";
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"app_role";
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO :"app_role";

-- Ciphertext is write-only for the app.
REVOKE SELECT, UPDATE ON alpaca_connections FROM :"app_role";
GRANT SELECT (
  id, workspace_id, name, environment, key_id_last4, status,
  last_verified_at, created_by_user_id, created_at, updated_at
) ON alpaca_connections TO :"app_role";
GRANT UPDATE (
  name, status, last_verified_at, updated_at,
  key_id_ciphertext, secret_ciphertext, key_id_last4
) ON alpaca_connections TO :"app_role";

-- The usage audit is written only by read_alpaca_credentials().
REVOKE INSERT, UPDATE, DELETE ON alpaca_credential_uses FROM :"app_role";

GRANT EXECUTE ON FUNCTION read_alpaca_credentials(text, text, text)
  TO :"app_role";

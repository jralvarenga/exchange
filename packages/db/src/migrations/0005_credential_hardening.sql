CREATE TABLE "alpaca_credential_uses" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text,
	"purpose" text NOT NULL,
	"use_count" integer DEFAULT 1 NOT NULL,
	"first_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alpaca_credential_uses_purpose_check" CHECK ("alpaca_credential_uses"."purpose" in ('read', 'trade', 'test'))
);
--> statement-breakpoint
ALTER TABLE "alpaca_credential_uses" ADD CONSTRAINT "alpaca_credential_uses_connection_id_alpaca_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."alpaca_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alpaca_credential_uses" ADD CONSTRAINT "alpaca_credential_uses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alpaca_credential_uses" ADD CONSTRAINT "alpaca_credential_uses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alpaca_credential_uses_connection_user_purpose_unique" ON "alpaca_credential_uses" USING btree ("connection_id","user_id","purpose");--> statement-breakpoint
CREATE INDEX "alpaca_credential_uses_workspace_idx" ON "alpaca_credential_uses" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alpaca_connections_workspace_id_unique" ON "alpaca_connections" USING btree ("workspace_id","id");--> statement-breakpoint
ALTER TABLE "alpaca_connections" ADD CONSTRAINT "alpaca_connections_key_id_ciphertext_format" CHECK ("alpaca_connections"."key_id_ciphertext" ~ '^v[0-9]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$');--> statement-breakpoint
ALTER TABLE "alpaca_connections" ADD CONSTRAINT "alpaca_connections_secret_ciphertext_format" CHECK ("alpaca_connections"."secret_ciphertext" ~ '^v[0-9]+:[A-Za-z0-9_-]+:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$');--> statement-breakpoint
ALTER TABLE "alpaca_connections" ADD CONSTRAINT "alpaca_connections_ciphertexts_distinct" CHECK ("alpaca_connections"."key_id_ciphertext" <> "alpaca_connections"."secret_ciphertext");--> statement-breakpoint
ALTER TABLE "alpaca_connections" ADD CONSTRAINT "alpaca_connections_key_id_last4_charset" CHECK ("alpaca_connections"."key_id_last4" ~ '^[A-Za-z0-9]{4}$');--> statement-breakpoint
-- Ciphertext is bound to its connection, environment and (from v2) workspace.
-- Moving a row would keep a key usable somewhere else, so those columns are fixed.
CREATE FUNCTION alpaca_connections_lock_binding() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
     OR NEW.environment IS DISTINCT FROM OLD.environment THEN
    RAISE EXCEPTION 'alpaca_connections id, workspace_id and environment are immutable'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER alpaca_connections_lock_binding
BEFORE UPDATE ON alpaca_connections
FOR EACH ROW EXECUTE FUNCTION alpaca_connections_lock_binding();--> statement-breakpoint
-- A member's pick and a workspace default must name a connection of the same
-- workspace. The single-column foreign keys still null the pointer on delete.
UPDATE workspace_members m SET active_connection_id = NULL
WHERE active_connection_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM alpaca_connections c
    WHERE c.id = m.active_connection_id AND c.workspace_id = m.workspace_id
  );--> statement-breakpoint
UPDATE workspaces w SET default_connection_id = NULL
WHERE default_connection_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM alpaca_connections c
    WHERE c.id = w.default_connection_id AND c.workspace_id = w.id
  );--> statement-breakpoint
ALTER TABLE workspace_members
  ADD CONSTRAINT workspace_members_active_connection_same_workspace
  FOREIGN KEY (workspace_id, active_connection_id)
  REFERENCES alpaca_connections (workspace_id, id)
  ON DELETE SET NULL (active_connection_id);--> statement-breakpoint
ALTER TABLE workspaces
  ADD CONSTRAINT workspaces_default_connection_same_workspace
  FOREIGN KEY (id, default_connection_id)
  REFERENCES alpaca_connections (workspace_id, id)
  ON DELETE SET NULL (default_connection_id);--> statement-breakpoint
-- The one path to ciphertext. Checks membership and records the use.
-- Role and permission rules stay in packages/auth/src/access.ts.
-- With the app role from packages/db/sql/app-role.sql, the app cannot read
-- the ciphertext columns directly, nor write alpaca_credential_uses.
CREATE FUNCTION read_alpaca_credentials(
  p_connection_id text,
  p_workspace_id text,
  p_user_id text,
  p_purpose text
)
RETURNS TABLE (key_id_ciphertext text, secret_ciphertext text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_purpose NOT IN ('read', 'trade', 'test') THEN
    RAISE EXCEPTION 'invalid credential purpose'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'not a workspace member'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM alpaca_connections c
    WHERE c.id = p_connection_id AND c.workspace_id = p_workspace_id
  ) THEN
    RETURN;
  END IF;

  INSERT INTO alpaca_credential_uses (
    id, connection_id, workspace_id, user_id, purpose
  )
  VALUES (
    gen_random_uuid()::text, p_connection_id, p_workspace_id, p_user_id, p_purpose
  )
  ON CONFLICT (connection_id, user_id, purpose) DO UPDATE
  SET use_count = alpaca_credential_uses.use_count + 1,
      last_used_at = now();

  RETURN QUERY
    SELECT c.key_id_ciphertext, c.secret_ciphertext
    FROM alpaca_connections c
    WHERE c.id = p_connection_id AND c.workspace_id = p_workspace_id;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION read_alpaca_credentials(text, text, text, text) FROM PUBLIC;

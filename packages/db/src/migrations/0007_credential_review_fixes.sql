ALTER TABLE "alpaca_connections" DROP CONSTRAINT "alpaca_connections_key_id_ciphertext_format";--> statement-breakpoint
ALTER TABLE "alpaca_connections" DROP CONSTRAINT "alpaca_connections_secret_ciphertext_format";--> statement-breakpoint
ALTER TABLE "alpaca_credential_uses" ADD CONSTRAINT "alpaca_credential_uses_connection_same_workspace" FOREIGN KEY ("workspace_id","connection_id") REFERENCES "public"."alpaca_connections"("workspace_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alpaca_connections" ADD CONSTRAINT "alpaca_connections_key_id_ciphertext_format" CHECK ("alpaca_connections"."key_id_ciphertext" ~ '^v[12]:[A-Za-z0-9_-]+:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$');--> statement-breakpoint
ALTER TABLE "alpaca_connections" ADD CONSTRAINT "alpaca_connections_secret_ciphertext_format" CHECK ("alpaca_connections"."secret_ciphertext" ~ '^v[12]:[A-Za-z0-9_-]+:[A-Za-z0-9_-]{16}:[A-Za-z0-9_-]{22}:[A-Za-z0-9_-]+$');--> statement-breakpoint
-- New or replaced keys must use the current, workspace-bound box. Rows still on
-- v1 stay readable (and their status can change) until the rewrap script runs.
CREATE FUNCTION alpaca_connections_require_current_box() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.key_id_ciphertext NOT LIKE 'v2:%'
     OR NEW.secret_ciphertext NOT LIKE 'v2:%' THEN
    RAISE EXCEPTION 'alpaca credentials must be written in the v2 format'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER alpaca_connections_require_current_box
BEFORE INSERT OR UPDATE OF key_id_ciphertext, secret_ciphertext ON alpaca_connections
FOR EACH ROW EXECUTE FUNCTION alpaca_connections_require_current_box();--> statement-breakpoint
-- The reader no longer takes a user id: it authorizes and records the member
-- set for this transaction by withMemberScope, so a caller cannot name another
-- member to read keys or forge the usage audit.
DROP FUNCTION read_alpaca_credentials(text, text, text, text);--> statement-breakpoint
CREATE FUNCTION read_alpaca_credentials(
  p_connection_id text,
  p_workspace_id text,
  p_purpose text
)
RETURNS TABLE (key_id_ciphertext text, secret_ciphertext text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id text := nullif(current_setting('app.user_id', true), '');
BEGIN
  IF p_purpose NOT IN ('read', 'trade', 'test') THEN
    RAISE EXCEPTION 'invalid credential purpose'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF v_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM workspace_members m
    WHERE m.workspace_id = p_workspace_id AND m.user_id = v_user_id
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
    gen_random_uuid()::text, p_connection_id, p_workspace_id, v_user_id, p_purpose
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
REVOKE ALL ON FUNCTION read_alpaca_credentials(text, text, text) FROM PUBLIC;

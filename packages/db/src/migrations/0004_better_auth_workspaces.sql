DROP INDEX "workspace_invitations_pending_unique";--> statement-breakpoint
ALTER TABLE "workspace_invitations" ALTER COLUMN "token_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_organization_id" text;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "slug" text DEFAULT gen_random_uuid()::text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_organization_id_workspaces_id_fk" FOREIGN KEY ("active_organization_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Preserve old invitation links and distinguish accepted and expired history.
UPDATE "workspace_invitations"
SET "status" = CASE
  WHEN "accepted_at" IS NOT NULL THEN 'accepted'
  WHEN "expires_at" <= now() THEN 'canceled'
  ELSE 'pending'
END;--> statement-breakpoint
UPDATE "workspaces" SET "slug" = "id";--> statement-breakpoint
UPDATE "sessions" SET "active_organization_id" = "users"."active_workspace_id"
FROM "users" WHERE "sessions"."user_id" = "users"."id";--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_pending_unique" ON "workspace_invitations" USING btree ("workspace_id","email") WHERE "workspace_invitations"."status" = 'pending';--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_status_check" CHECK ("workspace_invitations"."status" in ('pending', 'accepted', 'rejected', 'canceled'));
--> statement-breakpoint
-- Keep the old accepted_at readers safe during a rolling deployment. The
-- plugin owns status; accepted_at remains the legacy closed-invitation marker.
CREATE FUNCTION sync_workspace_invitation_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.accepted_at IS DISTINCT FROM OLD.accepted_at
     AND NEW.accepted_at IS NOT NULL AND NEW.status = 'pending' THEN
    NEW.status := 'accepted';
  END IF;
  IF NEW.status <> 'pending' THEN
    NEW.accepted_at := COALESCE(NEW.accepted_at, now());
  ELSE
    NEW.accepted_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER workspace_invitation_status_sync
BEFORE INSERT OR UPDATE ON workspace_invitations
FOR EACH ROW EXECUTE FUNCTION sync_workspace_invitation_status();--> statement-breakpoint
-- Better Auth checks the last owner before writing. Serialize and recheck at
-- commit as well, so concurrent demotions/removals cannot both succeed. Deferred
-- execution lets Better Auth delete members and then their organization in one
-- transaction without blocking legitimate workspace deletion.
CREATE FUNCTION require_workspace_owner() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.role <> 'owner' THEN RETURN NULL; END IF;
  IF TG_OP = 'UPDATE' AND NEW.role = 'owner' AND NEW.workspace_id = OLD.workspace_id THEN
    RETURN NULL;
  END IF;
  PERFORM id FROM workspaces WHERE id = OLD.workspace_id FOR UPDATE;
  IF FOUND AND NOT EXISTS (
    SELECT 1 FROM workspace_members WHERE workspace_id = OLD.workspace_id AND role = 'owner'
  ) THEN
    RAISE EXCEPTION 'A workspace needs at least one owner.' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END;
$$;--> statement-breakpoint
CREATE CONSTRAINT TRIGGER workspace_requires_owner
AFTER UPDATE OR DELETE ON workspace_members
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION require_workspace_owner();

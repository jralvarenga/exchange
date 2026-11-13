ALTER TABLE "workspace_invitations" DROP CONSTRAINT "workspace_invitations_role_check";--> statement-breakpoint
ALTER TABLE "workspace_members" DROP CONSTRAINT "workspace_members_role_check";--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_role_check" CHECK ("workspace_invitations"."role" in ('owner', 'admin', 'member', 'paper_trader', 'viewer'));--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_role_check" CHECK ("workspace_members"."role" in ('owner', 'admin', 'member', 'paper_trader', 'viewer'));
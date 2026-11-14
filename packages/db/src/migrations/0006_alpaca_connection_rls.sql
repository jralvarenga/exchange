ALTER TABLE "alpaca_connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "alpaca_connections_member_access" ON "alpaca_connections" AS PERMISSIVE FOR ALL TO public USING (exists (
  select 1 from workspace_members m
  where m.workspace_id = alpaca_connections.workspace_id
    and m.user_id = current_setting('app.user_id', true)
)) WITH CHECK (exists (
  select 1 from workspace_members m
  where m.workspace_id = alpaca_connections.workspace_id
    and m.user_id = current_setting('app.user_id', true)
));
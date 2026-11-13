DROP INDEX "orders_alpaca_order_idx";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "environment" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "activity_logs_connection_idx" ON "activity_logs" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "order_events_user_idx" ON "order_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_events_connection_idx" ON "order_events" USING btree ("connection_id");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_workspace_alpaca_order_unique" ON "orders" USING btree ("workspace_id","alpaca_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_pending_unique" ON "workspace_invitations" USING btree ("workspace_id","email") WHERE "workspace_invitations"."accepted_at" is null;
CREATE TABLE "crypto_wallets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"chain" text NOT NULL,
	"asset" text NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crypto_wallets_chain_check" CHECK ("crypto_wallets"."chain" in ('ethereum', 'solana')),
	CONSTRAINT "crypto_wallets_asset_check" CHECK ("crypto_wallets"."asset" in ('USDC', 'USDT'))
);
--> statement-breakpoint
ALTER TABLE "crypto_wallets" ADD CONSTRAINT "crypto_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crypto_wallets_user_chain_asset_unique" ON "crypto_wallets" USING btree ("user_id","chain","asset");
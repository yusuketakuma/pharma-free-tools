CREATE TABLE "pharmacy_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"pharmacy_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"status" text DEFAULT 'trialing' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"trial_starts_at" timestamp,
	"trial_ends_at" timestamp,
	"current_period_starts_at" timestamp,
	"current_period_ends_at" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pharmacy_subscriptions_pharmacy_id_unique" UNIQUE("pharmacy_id"),
	CONSTRAINT "chk_pharmacy_subscriptions_status" CHECK ("pharmacy_subscriptions"."status" IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete'))
);
--> statement-breakpoint
CREATE TABLE "subscription_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"event_type" varchar(64) NOT NULL,
	"stripe_event_id" varchar(255),
	"payload_json" text,
	"processed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_events_stripe_event_id_unique" UNIQUE("stripe_event_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"stripe_invoice_id" varchar(255) NOT NULL,
	"amount_yen" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'jpy' NOT NULL,
	"status" varchar(32) NOT NULL,
	"invoice_pdf_url" text,
	"hosted_invoice_url" text,
	"due_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_invoices_stripe_invoice_id_unique" UNIQUE("stripe_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"monthly_price_yen" integer NOT NULL,
	"max_pharmacies" integer NOT NULL,
	"max_items" integer NOT NULL,
	"features_json" text,
	"stripe_product_id" varchar(255),
	"stripe_price_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_plans_name_unique" UNIQUE("name"),
	CONSTRAINT "chk_subscription_plans_name" CHECK ("subscription_plans"."name" IN ('light', 'standard', 'enterprise'))
);
--> statement-breakpoint
ALTER TABLE "pharmacy_subscriptions" ADD CONSTRAINT "pharmacy_subscriptions_pharmacy_id_pharmacies_id_fk" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pharmacy_subscriptions" ADD CONSTRAINT "pharmacy_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_pharmacy_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."pharmacy_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_invoices" ADD CONSTRAINT "subscription_invoices_subscription_id_pharmacy_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."pharmacy_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_pharmacy_subscriptions_pharmacy" ON "pharmacy_subscriptions" USING btree ("pharmacy_id");--> statement-breakpoint
CREATE INDEX "idx_pharmacy_subscriptions_status" ON "pharmacy_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_pharmacy_subscriptions_stripe_customer" ON "pharmacy_subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "idx_pharmacy_subscriptions_stripe_subscription" ON "pharmacy_subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_events_subscription" ON "subscription_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_events_type" ON "subscription_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_subscription_events_stripe_event" ON "subscription_events" USING btree ("stripe_event_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_invoices_subscription" ON "subscription_invoices" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_subscription_invoices_status" ON "subscription_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscription_invoices_stripe_invoice" ON "subscription_invoices" USING btree ("stripe_invoice_id");
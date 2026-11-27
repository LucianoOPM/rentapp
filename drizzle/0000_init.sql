CREATE TYPE "public"."charge_concept" AS ENUM('rent', 'deposit', 'power', 'water', 'internet', 'other');--> statement-breakpoint
CREATE TYPE "public"."charge_status" AS ENUM('pending', 'in_review', 'paid');--> statement-breakpoint
CREATE TYPE "public"."lease_status" AS ENUM('draft', 'pending_signature', 'signed', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('in_review', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('received', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'renter');--> statement-breakpoint
CREATE TABLE "charge" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" integer NOT NULL,
	"period" text NOT NULL,
	"concept" charge_concept NOT NULL,
	"amount_cents" integer NOT NULL,
	"due_date" date NOT NULL,
	"receipt_file_id" integer,
	"status" charge_status DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charge_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "charge_amount_cents_check" CHECK ("charge"."amount_cents" >= 0),
	CONSTRAINT "charge_period_check" CHECK ("charge"."period" ~ '^[0-9]{4}-(0[1-9]|1[0-2])$')
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "file_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "file_provider_key_unique" UNIQUE("provider","key")
);
--> statement-breakpoint
CREATE TABLE "lease" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" integer NOT NULL,
	"renter_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"rent_cents" integer NOT NULL,
	"deposit_cents" integer NOT NULL,
	"status" "lease_status" DEFAULT 'draft' NOT NULL,
	"original_file_id" integer,
	"signed_file_id" integer,
	"original_sha256" text,
	"signed_at" timestamp with time zone,
	"signer_ip" text,
	"signer_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lease_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "lease_rent_cents_check" CHECK ("lease"."rent_cents" >= 0),
	CONSTRAINT "lease_deposit_cents_check" CHECK ("lease"."deposit_cents" >= 0),
	CONSTRAINT "lease_dates_check" CHECK ("lease"."end_date" >= "lease"."start_date")
);
--> statement-breakpoint
CREATE TABLE "maintenance_report" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" "report_status" DEFAULT 'received' NOT NULL,
	"admin_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_report_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"lease_id" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"proof_file_id" integer NOT NULL,
	"status" "payment_status" DEFAULT 'in_review' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "payment_amount_cents_check" CHECK ("payment"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment_charge" (
	"payment_id" integer NOT NULL,
	"charge_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_charge_payment_id_charge_id_pk" PRIMARY KEY("payment_id","charge_id")
);
--> statement-breakpoint
CREATE TABLE "report_photo" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"file_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"wifi_ssid" text,
	"wifi_password_enc" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "unit_sort_order_unique" UNIQUE("sort_order")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" serial PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" integer NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"username" text,
	"display_username" text,
	"role" "user_role" DEFAULT 'renter' NOT NULL,
	"phone" text,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_lease_id_lease_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."lease"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_receipt_file_id_file_id_fk" FOREIGN KEY ("receipt_file_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease" ADD CONSTRAINT "lease_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease" ADD CONSTRAINT "lease_renter_id_user_id_fk" FOREIGN KEY ("renter_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease" ADD CONSTRAINT "lease_original_file_id_file_id_fk" FOREIGN KEY ("original_file_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease" ADD CONSTRAINT "lease_signed_file_id_file_id_fk" FOREIGN KEY ("signed_file_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_report" ADD CONSTRAINT "maintenance_report_unit_id_unit_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."unit"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_report" ADD CONSTRAINT "maintenance_report_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_lease_id_lease_id_fk" FOREIGN KEY ("lease_id") REFERENCES "public"."lease"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_proof_file_id_file_id_fk" FOREIGN KEY ("proof_file_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_charge" ADD CONSTRAINT "payment_charge_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_charge" ADD CONSTRAINT "payment_charge_charge_id_charge_id_fk" FOREIGN KEY ("charge_id") REFERENCES "public"."charge"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_photo" ADD CONSTRAINT "report_photo_report_id_maintenance_report_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."maintenance_report"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_photo" ADD CONSTRAINT "report_photo_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lease_one_active_per_unit" ON "lease" USING btree ("unit_id") WHERE "lease"."status" IN ('pending_signature', 'signed');--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
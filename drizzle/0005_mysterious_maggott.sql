-- File: drizzle/0005_mysterious_maggott.sql

CREATE TABLE "analysis_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"zodiac_result_id" integer NOT NULL,
	"analysis_text" text NOT NULL,
	"full_prompt" text NOT NULL,
	"system_message" text,
	"model" text NOT NULL,
	"temperature" real,
	"max_tokens" integer,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"finish_reason" text,
	"response_id" text,
	"chart_data_snapshot" jsonb,
	"analysis_type" text DEFAULT 'mystical',
	"analysis_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"session_id" text
);
--> statement-breakpoint
ALTER TABLE "analysis_records" ADD CONSTRAINT "analysis_records_zodiac_result_id_zodiac_results_id_fk" FOREIGN KEY ("zodiac_result_id") REFERENCES "public"."zodiac_results"("id") ON DELETE cascade ON UPDATE no action;

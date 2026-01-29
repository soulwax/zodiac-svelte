-- File: drizzle/0000_heavy_leo.sql

CREATE TABLE "sverdle_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"word_index" integer NOT NULL,
	"answer" text NOT NULL,
	"guesses" jsonb NOT NULL,
	"answers" jsonb NOT NULL,
	"won" boolean NOT NULL,
	"attempts" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"age" integer
);
--> statement-breakpoint
CREATE TABLE "zodiac_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"birth_date" text NOT NULL,
	"birth_time" text NOT NULL,
	"place_name" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"timezone" text,
	"sun_sign" text NOT NULL,
	"ascendant" text NOT NULL,
	"moon_sign" text NOT NULL,
	"houses" jsonb NOT NULL,
	"utc_year" integer NOT NULL,
	"utc_month" integer NOT NULL,
	"utc_day" integer NOT NULL,
	"utc_hour" integer NOT NULL,
	"utc_minute" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"session_id" text
);

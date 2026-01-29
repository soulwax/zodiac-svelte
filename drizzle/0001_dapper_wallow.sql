-- File: drizzle/0001_dapper_wallow.sql

ALTER TABLE "zodiac_results" ADD COLUMN "planets" jsonb NOT NULL;

// File: drizzle.config.ts

import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local for local development
// Load .env first, then .env.local (which will override)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

// Support both Vercel's POSTGRES_URL and local DATABASE_URL
const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('POSTGRES_URL or DATABASE_URL must be set');
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: databaseUrl },
	verbose: true,
	strict: true
});

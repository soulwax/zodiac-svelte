import { defineConfig } from 'drizzle-kit';

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

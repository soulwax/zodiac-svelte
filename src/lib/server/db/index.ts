import { env } from '$env/dynamic/private';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon serverless driver - optimized for edge functions and serverless
// Automatically manages connection pooling and supports both DATABASE_URL and POSTGRES_URL
const connectionString = env.DATABASE_URL || env.POSTGRES_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL or POSTGRES_URL must be set');
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

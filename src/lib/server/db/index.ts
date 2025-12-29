import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

// Vercel Postgres automatically manages connection pooling
// No need for manual connection management or singleton pattern
export const db = drizzle(sql, { schema });

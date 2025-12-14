import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function initializeDb() {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL is not set');
	}
	if (!client) {
		client = postgres(env.DATABASE_URL);
	}
	if (!dbInstance) {
		dbInstance = drizzle(client, { schema });
	}
	return dbInstance;
}

// Lazy initialization - only connects when db is actually used
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(_target, prop) {
		const db = initializeDb();
		const value = db[prop as keyof ReturnType<typeof drizzle>];
		// If it's a function, bind it to the db instance
		if (typeof value === 'function') {
			return value.bind(db);
		}
		return value;
	}
}) as ReturnType<typeof drizzle>;

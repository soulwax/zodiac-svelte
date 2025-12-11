import {
    boolean,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	age: integer('age')
});

// Sverdle game results table
export const sverdleResults = pgTable('sverdle_results', {
	id: serial('id').primaryKey(),
	// Game state
	wordIndex: integer('word_index').notNull(), // Index of the word in the words array
	answer: text('answer').notNull(), // The correct answer word
	guesses: jsonb('guesses').$type<string[]>().notNull(), // Array of guessed words
	answers: jsonb('answers').$type<string[]>().notNull(), // Array of answer patterns (e.g., ['__x_c', 'x____'])
	// Game outcome
	won: boolean('won').notNull(), // Whether the player won
	attempts: integer('attempts').notNull(), // Number of attempts (guesses.length)
	// Metadata
	createdAt: timestamp('created_at').defaultNow().notNull(),
	completedAt: timestamp('completed_at'), // When the game ended
	// Optional: user/session identifier
	sessionId: text('session_id') // Cookie or session identifier
});

// Zodiac calculation results table
export const zodiacResults = pgTable('zodiac_results', {
	id: serial('id').primaryKey(),
	// Birth information
	birthDate: text('birth_date').notNull(), // Date string (YYYY-MM-DD)
	birthTime: text('birth_time').notNull(), // Time string (HH:MM)
	// Location information
	placeName: text('place_name').notNull(), // Display name of the place
	latitude: text('latitude').notNull(), // Latitude as string
	longitude: text('longitude').notNull(), // Longitude as string
	timezone: text('timezone'), // Timezone string if available
	// Calculated signs
	sunSign: text('sun_sign').notNull(), // Calculated sun sign
	ascendant: text('ascendant').notNull(), // Calculated ascendant/rising sign
	moonSign: text('moon_sign').notNull(), // Calculated moon sign
	// Planet positions (stored as JSON object)
	planets: jsonb('planets').$type<Record<string, { sign: string; house?: number }>>(),
	// Houses (stored as JSON array)
	houses: jsonb('houses').$type<Array<{ number: number; sign: string }>>().notNull(),
	// UTC time components used for calculations
	utcYear: integer('utc_year').notNull(),
	utcMonth: integer('utc_month').notNull(),
	utcDay: integer('utc_day').notNull(),
	utcHour: integer('utc_hour').notNull(),
	utcMinute: integer('utc_minute').notNull(),
	// Metadata
	createdAt: timestamp('created_at').defaultNow().notNull(),
	// Optional: user/session identifier
	sessionId: text('session_id') // Cookie or session identifier
});

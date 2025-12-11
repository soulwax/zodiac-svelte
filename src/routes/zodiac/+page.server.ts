import { db } from '$lib/server/db';
import { zodiacResults } from '$lib/server/db/schema';
import type { Actions } from './$types';

export const actions = {
	save: async ({ request, cookies }) => {
		try {
			const data = await request.formData();

			// Get all the form data
			const birthDate = data.get('birthDate') as string;
			const birthTime = data.get('birthTime') as string;
			const placeName = data.get('placeName') as string;
			const latitude = data.get('latitude') as string;
			const longitude = data.get('longitude') as string;
			const timezone = data.get('timezone') as string | null;
			const sunSign = data.get('sunSign') as string;
			const ascendant = data.get('ascendant') as string;
			const moonSign = data.get('moonSign') as string;
			const housesJson = data.get('houses') as string;
			const planetsJson = data.get('planets') as string;
			const utcYear = parseInt(data.get('utcYear') as string);
			const utcMonth = parseInt(data.get('utcMonth') as string);
			const utcDay = parseInt(data.get('utcDay') as string);
			const utcHour = parseInt(data.get('utcHour') as string);
			const utcMinute = parseInt(data.get('utcMinute') as string);

			// Parse houses JSON
			const houses = JSON.parse(housesJson);
			
			// Parse planets JSON (with default empty object if not provided)
			const planets = planetsJson ? JSON.parse(planetsJson) : {};

			// Get session ID from cookies (or generate one)
			const sessionId = cookies.get('sessionId') || crypto.randomUUID();
			if (!cookies.get('sessionId')) {
				cookies.set('sessionId', sessionId, { path: '/' });
			}

			// Save to database
			await db.insert(zodiacResults).values({
				birthDate,
				birthTime,
				placeName,
				latitude,
				longitude,
				timezone: timezone || null,
				sunSign,
				ascendant,
				moonSign,
				planets,
				houses,
				utcYear,
				utcMonth,
				utcDay,
				utcHour,
				utcMinute,
				sessionId
			});

			return { success: true };
		} catch (error) {
			console.error('Error saving zodiac result:', error);
			return { success: false, error: 'Failed to save result' };
		}
	}
} satisfies Actions;

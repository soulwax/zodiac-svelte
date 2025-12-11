import { db } from '$lib/server/db';
import { zodiacResults } from '$lib/server/db/schema';
import { generateMysticalAnalysis } from '$lib/server/openai';
import { desc, eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions = {
	save: async ({ request, cookies }) => {
		try {
			const data = await request.formData();

			// Get all the form data
			const fullName = data.get('fullName') as string | null;
			const lifeTrajectory = data.get('lifeTrajectory') as string | null;
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
				fullName: fullName || null,
				lifeTrajectory: lifeTrajectory || null,
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
	},
	analyze: async ({ request, cookies }) => {
		try {
			const data = await request.formData();
			const resultId = data.get('resultId') as string | null;

			let chartData;

			if (resultId) {
				// Fetch existing chart from database
				const result = await db
					.select()
					.from(zodiacResults)
					.where(eq(zodiacResults.id, parseInt(resultId)))
					.limit(1);

				if (result.length === 0) {
					return { success: false, error: 'Chart not found' };
				}

				const record = result[0];
				chartData = {
					fullName: record.fullName,
					lifeTrajectory: record.lifeTrajectory,
					birthDate: record.birthDate,
					birthTime: record.birthTime,
					placeName: record.placeName,
					sunSign: record.sunSign,
					ascendant: record.ascendant,
					moonSign: record.moonSign,
					planets: (record.planets as Record<string, { sign: string; house?: number }>) || {},
					houses: (record.houses as Array<{ number: number; sign: string }>) || []
				};
			} else {
				// Get chart data from form
				const fullName = data.get('fullName') as string | null;
				const lifeTrajectory = data.get('lifeTrajectory') as string | null;
				const birthDate = data.get('birthDate') as string;
				const birthTime = data.get('birthTime') as string;
				const placeName = data.get('placeName') as string;
				const sunSign = data.get('sunSign') as string;
				const ascendant = data.get('ascendant') as string;
				const moonSign = data.get('moonSign') as string;
				const housesJson = data.get('houses') as string;
				const planetsJson = data.get('planets') as string;

				chartData = {
					fullName: fullName || null,
					lifeTrajectory: lifeTrajectory || null,
					birthDate,
					birthTime,
					placeName,
					sunSign,
					ascendant,
					moonSign,
					planets: planetsJson ? JSON.parse(planetsJson) : {},
					houses: housesJson ? JSON.parse(housesJson) : []
				};
			}

			// Generate mystical analysis
			const analysis = await generateMysticalAnalysis(chartData);

			// Update or insert the analysis
			if (resultId) {
				// Update existing record
				await db
					.update(zodiacResults)
					.set({ aiAnalysis: analysis })
					.where(eq(zodiacResults.id, parseInt(resultId)));
			} else {
				// Get session ID from cookies
				const sessionId = cookies.get('sessionId');
				if (sessionId) {
					// Try to update the most recent record for this session
					const recentResult = await db
						.select()
						.from(zodiacResults)
						.where(eq(zodiacResults.sessionId, sessionId))
						.orderBy(desc(zodiacResults.createdAt))
						.limit(1);

					if (recentResult.length > 0) {
						await db
							.update(zodiacResults)
							.set({ aiAnalysis: analysis })
							.where(eq(zodiacResults.id, recentResult[0].id));
					}
				}
			}

			return { success: true, analysis };
		} catch (error) {
			console.error('Error generating analysis:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to generate analysis'
			};
		}
	}
} satisfies Actions;

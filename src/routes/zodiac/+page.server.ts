// File: src/routes/zodiac/+page.server.ts

import { db } from '$lib/server/db';
import { zodiacResults } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Actions } from './$types';

export const actions = {
	save: async ({ request, cookies }) => {
		try {
			const data = await request.formData();

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

			const houses = JSON.parse(housesJson);
			const planets = planetsJson ? JSON.parse(planetsJson) : {};

			const sessionId = cookies.get('sessionId') || crypto.randomUUID();
			if (!cookies.get('sessionId')) {
				cookies.set('sessionId', sessionId, { path: '/' });
			}

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
	analyze: async ({ request, fetch }) => {
		try {
			const data = await request.formData();
			const resultId = data.get('resultId') as string | null;

			let chartData:
				| {
						resultId?: string;
						fullName: string | null;
						lifeTrajectory: string | null;
						birthDate: string;
						birthTime: string;
						placeName: string;
						sunSign: string;
						ascendant: string;
						moonSign: string;
						planets: Record<string, { sign: string; house?: number }>;
						houses: Array<{ number: number; sign: string }>;
				  }
				| undefined;

			if (resultId) {
				const result = await db
					.select()
					.from(zodiacResults)
					.where(eq(zodiacResults.id, parseInt(resultId)))
					.limit(1);

				if (result.length === 0) {
					return { success: false, error: 'Chart not found' };
				}

				const record = result[0];
				const planets = (record.planets as Record<string, { sign: string; house?: number }>) || {};
				const houses = (record.houses as Array<{ number: number; sign: string }>) || [];
				const planetsWithHouses: Record<string, { sign: string; house?: number }> = { ...planets };

				if (record.sunSign && !planetsWithHouses.sun) {
					planetsWithHouses.sun = { sign: record.sunSign };
				}

				if (record.moonSign && !planetsWithHouses.moon) {
					planetsWithHouses.moon = { sign: record.moonSign };
				}

				chartData = {
					resultId,
					fullName: record.fullName,
					lifeTrajectory: record.lifeTrajectory,
					birthDate: record.birthDate,
					birthTime: record.birthTime,
					placeName: record.placeName,
					sunSign: record.sunSign,
					ascendant: record.ascendant,
					moonSign: record.moonSign,
					planets: planetsWithHouses,
					houses
				};
			} else {
				const fullName = data.get('fullName') as string | null;
				const lifeTrajectory = data.get('lifeTrajectory') as string | null;
				const birthDate = data.get('birthDate') as string;
				const birthTime = data.get('birthTime') as string;
				const placeName = data.get('placeName') as string;
				const sunSign = (data.get('sunSign') as string)?.trim() || null;
				const ascendant = (data.get('ascendant') as string)?.trim() || null;
				const moonSign = (data.get('moonSign') as string)?.trim() || null;
				const housesJson = data.get('houses') as string;
				const planetsJson = data.get('planets') as string;

				if (!sunSign || !moonSign || !ascendant) {
					return {
						success: false,
						error:
							'Missing required chart data. Please ensure sun sign, moon sign, and ascendant are provided.'
					};
				}

				const planets = planetsJson
					? (JSON.parse(planetsJson) as Record<string, { sign: string; house?: number }>)
					: {};
				const houses = housesJson ? (JSON.parse(housesJson) as Array<{ number: number; sign: string }>) : [];
				const planetsWithHouses: Record<string, { sign: string; house?: number }> = { ...planets };

				planetsWithHouses.sun ??= { sign: sunSign };
				planetsWithHouses.moon ??= { sign: moonSign };

				chartData = {
					fullName: fullName || null,
					lifeTrajectory: lifeTrajectory || null,
					birthDate,
					birthTime,
					placeName,
					sunSign,
					ascendant,
					moonSign,
					planets: planetsWithHouses,
					houses
				};
			}

			if (!chartData.sunSign || !chartData.moonSign || !chartData.ascendant) {
				return {
					success: false,
					error:
						'Missing required chart data. Please ensure sun sign, moon sign, and ascendant are calculated.'
				};
			}

			const response = await fetch('/api/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: request.headers.get('Cookie') || ''
				},
				body: JSON.stringify(chartData)
			});

			const result = await response.json();

			if (!result.success) {
				return {
					success: false,
					error: result.error || 'Failed to start analysis'
				};
			}

			return {
				success: true,
				jobId: result.jobId
			};
		} catch (error) {
			console.error('Error starting analysis:', error);
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('Full error details:', {
				message: errorMessage,
				stack: error instanceof Error ? error.stack : undefined,
				type: error instanceof Error ? error.constructor.name : typeof error
			});
			return {
				success: false,
				error: errorMessage
			};
		}
	}
} satisfies Actions;

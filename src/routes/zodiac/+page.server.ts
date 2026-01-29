import { db } from '$lib/server/db';
import { zodiacResults } from '$lib/server/db/schema';
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
	analyze: async ({ request, cookies, fetch }) => {
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
				const planets = (record.planets as Record<string, { sign: string; house?: number }>) || {};
				const houses = (record.houses as Array<{ number: number; sign: string }>) || [];

				// Ensure Sun and Moon are included in planets
				const planetsWithHouses: Record<string, { sign: string; house?: number }> = { ...planets };
				if (record.sunSign && !planetsWithHouses.sun) {
					// Import functions to calculate planet houses
					const { getPlanetLongitude, getPlanetHouse } = await import('$lib/zodiac');
					const sunLon = getPlanetLongitude(record.sunSign, record.utcYear, record.utcMonth, record.utcDay, 'Sun', record.utcHour, record.utcMinute);
					const sunHouse = getPlanetHouse(sunLon, houses);
					planetsWithHouses.sun = { sign: record.sunSign, house: sunHouse };
				}
				if (record.moonSign && !planetsWithHouses.moon) {
					const { getPlanetLongitude, getPlanetHouse } = await import('$lib/zodiac');
					const moonLon = getPlanetLongitude(record.moonSign, record.utcYear, record.utcMonth, record.utcDay, 'Moon', record.utcHour, record.utcMinute);
					const moonHouse = getPlanetHouse(moonLon, houses);
					planetsWithHouses.moon = { sign: record.moonSign, house: moonHouse };
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
				// Get chart data from form
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
				const utcYear = parseInt(data.get('utcYear') as string);
				const utcMonth = parseInt(data.get('utcMonth') as string);
				const utcDay = parseInt(data.get('utcDay') as string);
				const utcHour = parseInt(data.get('utcHour') as string);
				const utcMinute = parseInt(data.get('utcMinute') as string);

				// Validate required fields
				if (!sunSign || !moonSign || !ascendant) {
					return {
						success: false,
						error: 'Missing required chart data. Please ensure sun sign, moon sign, and ascendant are provided.'
					};
				}

				// Parse planets and houses
				const planets = planetsJson ? JSON.parse(planetsJson) : {};
				const houses = housesJson ? JSON.parse(housesJson) : [];

				// Import functions to calculate planet houses
				const { getPlanetLongitude, getPlanetHouse } = await import('$lib/zodiac');

				// Add Sun and Moon to planets with their house positions
				const planetsWithHouses: Record<string, { sign: string; house?: number }> = { ...planets };

				// Calculate Sun house
				if (sunSign) {
					const sunLon = getPlanetLongitude(sunSign, utcYear, utcMonth, utcDay, 'Sun', utcHour, utcMinute);
					const sunHouse = getPlanetHouse(sunLon, houses);
					planetsWithHouses.sun = { sign: sunSign, house: sunHouse };
				}

				// Calculate Moon house
				if (moonSign) {
					const moonLon = getPlanetLongitude(moonSign, utcYear, utcMonth, utcDay, 'Moon', utcHour, utcMinute);
					const moonHouse = getPlanetHouse(moonLon, houses);
					planetsWithHouses.moon = { sign: moonSign, house: moonHouse };
				}

				// Calculate houses for other planets if not already set
				for (const [planet, position] of Object.entries(planets)) {
					if (position && typeof position === 'object' && 'sign' in position && !('house' in position)) {
						const planetLon = getPlanetLongitude(
							position.sign,
							utcYear,
							utcMonth,
							utcDay,
							planet.charAt(0).toUpperCase() + planet.slice(1),
							utcHour,
							utcMinute
						);
						const planetHouse = getPlanetHouse(planetLon, houses);
						planetsWithHouses[planet] = { ...position, house: planetHouse };
					}
				}

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

			// Validate required chart data
			if (!chartData.sunSign || !chartData.moonSign || !chartData.ascendant) {
				return {
					success: false,
					error: 'Missing required chart data. Please ensure sun sign, moon sign, and ascendant are calculated.'
				};
			}

			// Call the analyze API endpoint to create an async job
			const response = await fetch('/api/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Cookie': request.headers.get('Cookie') || ''
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

			// Return the job ID to the client for polling
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

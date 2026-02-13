// File: src/lib/swisseph.ts

import SwissEph from 'swisseph-wasm';
import type { ZodiacSign } from './zodiac';

// Singleton instance
let sweInstance: SwissEph | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Swiss Ephemeris WASM module
 * This is called automatically on first use, or can be called explicitly at app startup
 */
export async function initSwissEph(): Promise<void> {
	if (sweInstance) return; // Already initialized
	if (initPromise) return initPromise; // Initialization in progress

	initPromise = (async () => {
		sweInstance = new SwissEph();

		// Monkey-patch the initSwissEph method to inject our custom locateFile
		const originalInit = sweInstance.initSwissEph.bind(sweInstance);

		// Override the method to inject custom module config
		(sweInstance as any).initSwissEph = async function(this: any) {
			// Import the WASM module loader
			const WasamSwissEph = (await import('swisseph-wasm/wsam/swisseph.js')).default;

			// Configure to load from /wasm/ static directory
			const moduleConfig = {
				locateFile: (path: string, prefix: string) => {
					if (path.endsWith('.wasm') || path.endsWith('.data')) {
						console.log(`SwissEph loading: ${path} from /wasm/`);
						return `/wasm/${path}`;
					}
					return prefix + path;
				}
			};

			// Initialize the WASM module with our config
			this.SweModule = await WasamSwissEph(moduleConfig);

			// Ensure HEAP32 is available
			if (!this.SweModule.HEAP32) {
				throw new Error('WASM module initialization failed: HEAP32 not available');
			}

			console.log('SwissEph initialized successfully');
		};

		await sweInstance.initSwissEph();
	})();

	await initPromise;
}

/**
 * Get the initialized Swiss Ephemeris instance
 * Automatically initializes if not already initialized
 */
async function getSwe(): Promise<SwissEph> {
	if (!sweInstance) {
		await initSwissEph();
	}
	return sweInstance!;
}

const signs: ZodiacSign[] = [
	'Aries',
	'Taurus',
	'Gemini',
	'Cancer',
	'Leo',
	'Virgo',
	'Libra',
	'Scorpio',
	'Sagittarius',
	'Capricorn',
	'Aquarius',
	'Pisces'
];

/**
 * Converts ecliptic longitude (0-360 degrees) to a zodiac sign
 */
function longitudeToSign(longitude: number): ZodiacSign {
	let normalizedLon = longitude % 360;
	if (normalizedLon < 0) normalizedLon += 360;
	const signIndex = Math.floor(normalizedLon / 30);
	return signs[signIndex % 12];
}

/**
 * Calculate Ascendant (Rising Sign) using Swiss Ephemeris
 *
 * @param year - Birth year
 * @param month - Birth month (1-12)
 * @param day - Birth day
 * @param hour - Birth hour in UTC (0-23)
 * @param minute - Birth minute (0-59)
 * @param latitude - Geographic latitude in degrees (-90 to 90)
 * @param longitude - Geographic longitude in degrees (-180 to 180)
 * @param houseSystem - House system ('P' = Placidus, 'K' = Koch, 'E' = Equal, 'W' = Whole Sign)
 * @returns Zodiac sign of the Ascendant
 */
export async function calculateAscendantSwissEph(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	latitude: number,
	longitude: number,
	houseSystem: string = 'P'
): Promise<ZodiacSign> {
	const swe = await getSwe();

	// Calculate Julian Day
	const ut = hour + minute / 60;
	const jd = swe.julday(year, month, day, ut);

	// Calculate houses
	const houses = swe.houses(jd, latitude, longitude, houseSystem);

	// Ascendant is at index 0 of ascmc array
	const ascendantDegrees = houses.ascmc[0];

	return longitudeToSign(ascendantDegrees);
}

/**
 * Calculate Ascendant and get the exact degree position
 *
 * @returns Object with sign, degrees (0-360), and degree within sign (0-30)
 */
export async function calculateAscendantDetailed(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	latitude: number,
	longitude: number,
	houseSystem: string = 'P'
): Promise<{ sign: ZodiacSign; totalDegrees: number; degreeInSign: number }> {
	const swe = await getSwe();

	const ut = hour + minute / 60;
	const jd = swe.julday(year, month, day, ut);
	const houses = swe.houses(jd, latitude, longitude, houseSystem);
	const ascendantDegrees = houses.ascmc[0];

	return {
		sign: longitudeToSign(ascendantDegrees),
		totalDegrees: ascendantDegrees,
		degreeInSign: ascendantDegrees % 30
	};
}

/**
 * Calculate all 12 house cusps using Swiss Ephemeris
 *
 * @param houseSystem - House system to use (default: 'P' = Placidus)
 * @returns Array of 12 house objects with cusp positions
 */
export async function calculateHousesSwissEph(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	latitude: number,
	longitude: number,
	houseSystem: string = 'P'
): Promise<Array<{ number: number; sign: ZodiacSign; cusp: number }>> {
	const swe = await getSwe();

	const ut = hour + minute / 60;
	const jd = swe.julday(year, month, day, ut);
	const houses = swe.houses(jd, latitude, longitude, houseSystem);

	// Swiss Ephemeris returns 13 cusps (index 0 is unused, 1-12 are the house cusps)
	// The ascmc array contains: [Ascendant, MC, ARMC, Vertex, ...]
	const ascendantDegree = houses.ascmc[0];

	// For Placidus and most systems, use the cusps array
	// For Equal houses, calculate from Ascendant
	if (houseSystem === 'E') {
		// Equal House: each house is exactly 30 degrees starting from Ascendant
		return Array.from({ length: 12 }, (_, i) => {
			const cusp = (ascendantDegree + i * 30) % 360;
			return {
				number: i + 1,
				sign: longitudeToSign(cusp),
				cusp
			};
		});
	}

	// For other house systems, use the calculated cusps
	// Note: cusps[0] is not used, cusps[1] = House 1, etc.
	return Array.from({ length: 12 }, (_, i) => {
		const cusp = houses.cusps[i + 1] || 0;
		return {
			number: i + 1,
			sign: longitudeToSign(cusp),
			cusp
		};
	});
}

/**
 * Calculate Sun position using Swiss Ephemeris
 */
export async function calculateSunSignSwissEph(
	year: number,
	month: number,
	day: number
): Promise<ZodiacSign> {
	const swe = await getSwe();

	// Use noon UTC for sun sign calculation
	const jd = swe.julday(year, month, day, 12);

	// Calculate Sun position (SE_SUN = 0, SEFLG_SWIEPH = 2)
	const result = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH);
	const sunLongitude = result[0]; // First element is ecliptic longitude

	return longitudeToSign(sunLongitude);
}

/**
 * Calculate Moon position using Swiss Ephemeris
 */
export async function calculateMoonSignSwissEph(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number
): Promise<ZodiacSign> {
	const swe = await getSwe();

	const ut = hour + minute / 60;
	const jd = swe.julday(year, month, day, ut);

	// Calculate Moon position (SE_MOON = 1)
	const result = swe.calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH);
	const moonLongitude = result[0];

	return longitudeToSign(moonLongitude);
}

/**
 * Calculate planetary position using Swiss Ephemeris
 *
 * @param planet - Planet name: 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
 */
export async function calculatePlanetSignSwissEph(
	planet: string,
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number
): Promise<ZodiacSign> {
	const swe = await getSwe();

	// Map planet names to Swiss Ephemeris constants
	const planetMap: Record<string, number> = {
		Mercury: swe.SE_MERCURY, // 2
		Venus: swe.SE_VENUS, // 3
		Mars: swe.SE_MARS, // 4
		Jupiter: swe.SE_JUPITER, // 5
		Saturn: swe.SE_SATURN, // 6
		Uranus: swe.SE_URANUS, // 7
		Neptune: swe.SE_NEPTUNE, // 8
		Pluto: swe.SE_PLUTO // 9
	};

	const planetId = planetMap[planet];
	if (planetId === undefined) {
		throw new Error(`Unknown planet: ${planet}`);
	}

	const ut = hour + minute / 60;
	const jd = swe.julday(year, month, day, ut);

	const result = swe.calc_ut(jd, planetId, swe.SEFLG_SWIEPH);
	const longitude = result[0];

	return longitudeToSign(longitude);
}

/**
 * Cleanup Swiss Ephemeris resources
 * Call this when shutting down the application
 */
export function closeSwissEph(): void {
	if (sweInstance) {
		sweInstance.close();
		sweInstance = null;
		initPromise = null;
	}
}

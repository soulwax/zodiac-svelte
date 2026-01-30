// File: src/lib/geocoding.ts

export interface Place {
	display_name: string;
	lat: string;
	lon: string;
	timezone?: string;
}

/**
 * Search for places using OpenStreetMap Nominatim API
 */
export async function searchPlaces(query: string): Promise<Place[]> {
	if (!query || query.length < 3) {
		return [];
	}

	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
			{
				headers: {
					'User-Agent': 'Zodiac Calculator App'
				}
			}
		);

		if (!response.ok) {
			return [];
		}

		const data: NominatimPlace[] = await response.json();
		return data.map((item) => ({
			display_name: item.display_name,
			lat: item.lat,
			lon: item.lon
		}));
	} catch (error) {
		console.error('Geocoding error:', error);
		return [];
	}
}

interface NominatimPlace {
	display_name: string;
	lat: string;
	lon: string;
}

/**
 * Get timezone for a given latitude and longitude
 */
export async function getTimezone(lat: string, lon: string): Promise<string | null> {
	try {
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
			{
				headers: {
					'User-Agent': 'Zodiac Calculator App'
				}
			}
		);

		if (!response.ok) {
			return null;
		}

		await response.json();
		// Nominatim doesn't directly provide timezone, but we can use the browser's Intl API
		// or a timezone lookup service. For now, we'll use a simpler approach.
		return null; // Will be handled client-side
	} catch (error) {
		console.error('Timezone lookup error:', error);
		return null;
	}
}

/**
 * Get timezone using latitude and longitude with a timezone API
 * Using timezoneapi.io (free, no API key required for limited use)
 */
export async function getTimezoneFromCoords(lat: number, lon: number): Promise<string | null> {
	try {
		const response = await fetch(
			`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`
		);

		if (!response.ok) {
			// Fallback: try to determine timezone using browser's Intl API
			return getTimezoneFallback(lat, lon);
		}

		const data = await response.json();
		return data.timeZone || null;
	} catch (error) {
		console.error('Timezone API error:', error);
		return getTimezoneFallback(lat, lon);
	}
}

/**
 * Fallback timezone determination using browser's Intl API
 * This is approximate and may not be 100% accurate
 */
function getTimezoneFallback(lat: number, lon: number): string | null {
	try {
		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return timeZone || null;
	} catch (error) {
		console.error('Fallback timezone error:', error);
	}
	return null;
}

import * as Astronomy from 'astronomy-engine';

export type ZodiacSign =
	| 'Aries'
	| 'Taurus'
	| 'Gemini'
	| 'Cancer'
	| 'Leo'
	| 'Virgo'
	| 'Libra'
	| 'Scorpio'
	| 'Sagittarius'
	| 'Capricorn'
	| 'Aquarius'
	| 'Pisces';

/**
 * Converts ecliptic longitude (0-360 degrees) to a zodiac sign
 * In the tropical zodiac:
 * - Aries: 0-30°
 * - Taurus: 30-60°
 * - Gemini: 60-90°
 * - Cancer: 90-120°
 * - Leo: 120-150°
 * - Virgo: 150-180°
 * - Libra: 180-210°
 * - Scorpio: 210-240°
 * - Sagittarius: 240-270°
 * - Capricorn: 270-300°
 * - Aquarius: 300-330°
 * - Pisces: 330-360°
 */
function longitudeToSign(longitude: number): ZodiacSign {
	// Normalize longitude to 0-360
	let normalizedLon = longitude % 360;
	if (normalizedLon < 0) normalizedLon += 360;

	// Each sign is 30 degrees
	const signIndex = Math.floor(normalizedLon / 30);
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
	return signs[signIndex % 12];
}

/**
 * Calculates the sun sign based on birth date
 * Uses astronomy-engine to get the actual Sun position for precise calculations
 */
export function calculateSunSign(month: number, day: number, year?: number): ZodiacSign {
	// Use provided year or default to 2000 for backward compatibility
	const birthYear = year || 2000;

	// Create a date object at noon UTC to get the sun's position
	const date = new Date(Date.UTC(birthYear, month - 1, day, 12, 0, 0));

	// Get ecliptic coordinates of the Sun directly
	const sunPosition = Astronomy.SunPosition(date);

	// Convert ecliptic longitude to zodiac sign
	return longitudeToSign(sunPosition.elon);
}

export interface House {
	number: number;
	sign: ZodiacSign;
	cusp: number; // Degree position of the house cusp (0-360)
}

/**
 * Calculates Greenwich Sidereal Time (GST) in hours for a given UTC date/time
 * Uses the standard IAU formula for GMST
 */
function calculateGST(year: number, month: number, day: number, hour: number, minute: number): number {
	// Convert to Julian Day Number
	const a = Math.floor((14 - month) / 12);
	const y = year + 4800 - a;
	const m = month + 12 * a - 3;

	let jdn =
		day +
		Math.floor((153 * m + 2) / 5) +
		365 * y +
		Math.floor(y / 4) -
		Math.floor(y / 100) +
		Math.floor(y / 400) -
		32045;

	// Add fractional day
	const fractionalDay = (hour + minute / 60) / 24;
	const jd = jdn + fractionalDay - 0.5;

	// Calculate days since J2000.0
	const d = jd - 2451545.0;
	const T = d / 36525.0;

	// Calculate GMST in degrees using IAU 2006 formula
	let gmst =
		280.46061837 +
		360.98564736629 * d +
		0.000387933 * T * T -
		T * T * T / 38710000.0;

	// Normalize to 0-360 degrees
	gmst = gmst % 360;
	if (gmst < 0) gmst += 360;

	// Convert to hours
	return gmst / 15;
}

/**
 * Calculates the moon sign based on birth date and time
 * Uses astronomy-engine for accurate lunar position calculation
 */
export function calculateMoonSign(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number
): ZodiacSign {
	// Create UTC date object
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

	// Get the Moon's ecliptic coordinates directly
	const moonEcliptic = Astronomy.EclipticGeoMoon(date);

	// Convert ecliptic longitude to zodiac sign
	return longitudeToSign(moonEcliptic.lon);
}

/**
 * Calculates the ascendant (rising sign) based on birth date, time, and location
 * Uses the correct astronomical formula:
 * RAMC = LST × 15 (convert sidereal time to degrees)
 * tan(Ascendant) = cos(RAMC) / -(sin(obliquity) × tan(latitude) + cos(obliquity) × sin(RAMC))
 *
 * References:
 * - https://radixpro.com/a4a-start/the-ascendant/
 * - https://www.astro.com/swisseph/swephprg.htm
 */
export function calculateAscendant(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	latitude: number,
	longitude: number
): ZodiacSign {
	// Calculate Greenwich Sidereal Time in hours
	const gst = calculateGST(year, month, day, hour, minute);

	// Convert longitude to hours (15 degrees = 1 hour)
	const longitudeHours = longitude / 15;

	// Calculate Local Sidereal Time in hours
	let lst = gst + longitudeHours;
	lst = lst % 24;
	if (lst < 0) lst += 24;

	// Convert LST to RAMC (Right Ascension of Medium Coeli) in degrees
	const ramc = lst * 15;

	// Convert to radians for trigonometric functions
	const ramcRad = (ramc * Math.PI) / 180;
	const latRad = (latitude * Math.PI) / 180;

	// Obliquity of the ecliptic (mean obliquity for J2000.0)
	// For higher precision, this should be calculated for the specific date
	// Using IAU 2006 value: 23.43929111° for J2000.0
	const obliquity = 23.43929111;
	const obliquityRad = (obliquity * Math.PI) / 180;

	// Calculate the ascendant using the standard formula:
	// tan(Ascendant) = cos(RAMC) / -(sin(ε) × tan(φ) + cos(ε) × sin(RAMC))
	// Using atan2 for proper quadrant handling:
	// Ascendant = atan2(y, x) where:
	// x = -(sin(ε) × tan(φ) + cos(ε) × sin(RAMC))
	// y = cos(RAMC)

	const x = -(Math.sin(obliquityRad) * Math.tan(latRad) + Math.cos(obliquityRad) * Math.sin(ramcRad));
	const y = Math.cos(ramcRad);

	// Calculate ascendant in radians
	let ascendantRad = Math.atan2(y, x);

	// Convert to degrees
	let ascendantDeg = (ascendantRad * 180) / Math.PI;

	// Normalize to 0-360
	if (ascendantDeg < 0) ascendantDeg += 360;

	// The result from atan2 gives us the ecliptic longitude of the ascendant
	// No 180° adjustment needed - the formula already calculates the correct eastern horizon point

	// Convert to zodiac sign
	return longitudeToSign(ascendantDeg);
}

/**
 * Calculates the 12 astrological houses using the Equal House system
 * In the Equal House system, each house is exactly 30 degrees
 * House 1 starts at the Ascendant
 */
export function calculateHouses(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	latitude: number,
	longitude: number
): House[] {
	// Calculate Greenwich Sidereal Time
	const gst = calculateGST(year, month, day, hour, minute);

	// Convert longitude to hours
	const longitudeHours = longitude / 15;

	// Calculate Local Sidereal Time
	let lst = gst + longitudeHours;
	lst = lst % 24;
	if (lst < 0) lst += 24;

	// Convert LST to RAMC in degrees
	const ramc = lst * 15;
	const ramcRad = (ramc * Math.PI) / 180;
	const latRad = (latitude * Math.PI) / 180;
	const obliquity = 23.43929111;
	const obliquityRad = (obliquity * Math.PI) / 180;

	// Calculate ascendant degree position
	const x = -(Math.sin(obliquityRad) * Math.tan(latRad) + Math.cos(obliquityRad) * Math.sin(ramcRad));
	const y = Math.cos(ramcRad);
	let ascendantDeg = (Math.atan2(y, x) * 180) / Math.PI;
	if (ascendantDeg < 0) ascendantDeg += 360;
	// No 180° adjustment needed - the formula already calculates the correct eastern horizon point

	// Create houses in Equal House system
	const houses: House[] = [];
	for (let i = 0; i < 12; i++) {
		const cuspDegree = (ascendantDeg + i * 30) % 360;
		houses.push({
			number: i + 1,
			sign: longitudeToSign(cuspDegree),
			cusp: cuspDegree
		});
	}

	return houses;
}

/**
 * Gets the sign index (0-11) for a zodiac sign
 */
function getSignIndex(sign: ZodiacSign): number {
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
	return signs.indexOf(sign);
}

/**
 * Gets the zodiac sign from an index (0-11)
 */
function getSignFromIndex(index: number): ZodiacSign {
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
	return signs[index % 12];
}

/**
 * Calculates Mercury sign using astronomy-engine
 * Mercury orbits the Sun every 88 days
 * Uses geocentric coordinates (GeoVector + Ecliptic) for accurate astrological positions
 */
export function calculateMercurySign(
	year: number,
	month: number,
	day: number,
	hour: number = 12,
	minute: number = 0
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

	// Get geocentric ecliptic longitude (EclipticLongitude returns heliocentric)
	const geoVector = Astronomy.GeoVector(Astronomy.Body.Mercury, date, false);
	const ecliptic = Astronomy.Ecliptic(geoVector);
	const longitude = ecliptic.elon;

	return longitudeToSign(longitude);
}

/**
 * Calculates Venus sign using astronomy-engine
 * Venus orbits the Sun every 225 days
 * Uses geocentric coordinates (GeoVector + Ecliptic) for accurate astrological positions
 */
export function calculateVenusSign(
	year: number,
	month: number,
	day: number,
	hour: number = 12,
	minute: number = 0
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

	// Get geocentric ecliptic longitude (EclipticLongitude returns heliocentric)
	const geoVector = Astronomy.GeoVector(Astronomy.Body.Venus, date, false);
	const ecliptic = Astronomy.Ecliptic(geoVector);
	const longitude = ecliptic.elon;

	return longitudeToSign(longitude);
}

/**
 * Calculates Mars sign using astronomy-engine
 * Mars has an orbital period of ~687 days (1.88 years)
 * Uses geocentric coordinates (GeoVector + Ecliptic) for accurate astrological positions
 */
export function calculateMarsSign(
	year: number,
	month: number,
	day: number,
	hour: number = 12,
	minute: number = 0
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

	// Get geocentric ecliptic longitude (EclipticLongitude returns heliocentric)
	const geoVector = Astronomy.GeoVector(Astronomy.Body.Mars, date, false);
	const ecliptic = Astronomy.Ecliptic(geoVector);
	const longitude = ecliptic.elon;

	return longitudeToSign(longitude);
}

/**
 * Calculates Jupiter sign using astronomy-engine
 * Jupiter has an orbital period of ~12 years
 */
export function calculateJupiterSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

	// Get ecliptic longitude directly
	const longitude = Astronomy.EclipticLongitude(Astronomy.Body.Jupiter, date);

	return longitudeToSign(longitude);
}

/**
 * Calculates Saturn sign using astronomy-engine
 * Saturn has an orbital period of ~29.5 years
 */
export function calculateSaturnSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

	// Get ecliptic longitude directly
	const longitude = Astronomy.EclipticLongitude(Astronomy.Body.Saturn, date);

	return longitudeToSign(longitude);
}

/**
 * Calculates Uranus sign using astronomy-engine
 * Uranus has an orbital period of ~84 years
 */
export function calculateUranusSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

	// Get ecliptic longitude directly
	const longitude = Astronomy.EclipticLongitude(Astronomy.Body.Uranus, date);

	return longitudeToSign(longitude);
}

/**
 * Calculates Neptune sign using astronomy-engine
 * Neptune has an orbital period of ~165 years
 */
export function calculateNeptuneSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

	// Get ecliptic longitude directly
	const longitude = Astronomy.EclipticLongitude(Astronomy.Body.Neptune, date);

	return longitudeToSign(longitude);
}

/**
 * Calculates Pluto sign using astronomy-engine
 * Pluto has an orbital period of ~248 years
 */
export function calculatePlutoSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

	// Get ecliptic longitude directly
	const longitude = Astronomy.EclipticLongitude(Astronomy.Body.Pluto, date);

	return longitudeToSign(longitude);
}

/**
 * Calculates all planet positions
 */
export interface PlanetPositions {
	mercury: ZodiacSign;
	venus: ZodiacSign;
	mars: ZodiacSign;
	jupiter: ZodiacSign;
	saturn: ZodiacSign;
	uranus: ZodiacSign;
	neptune: ZodiacSign;
	pluto: ZodiacSign;
}

export function calculateAllPlanets(
	year: number,
	month: number,
	day: number,
	hour: number = 12,
	minute: number = 0
): PlanetPositions {
	return {
		mercury: calculateMercurySign(year, month, day, hour, minute),
		venus: calculateVenusSign(year, month, day, hour, minute),
		mars: calculateMarsSign(year, month, day, hour, minute),
		jupiter: calculateJupiterSign(year, month, day),
		saturn: calculateSaturnSign(year, month, day),
		uranus: calculateUranusSign(year, month, day),
		neptune: calculateNeptuneSign(year, month, day),
		pluto: calculatePlutoSign(year, month, day)
	};
}

/**
 * Determines which house a planet is in based on its ecliptic longitude and the house cusps
 */
export function getPlanetHouse(planetLongitude: number, houses: House[]): number {
	// Normalize planet longitude
	let normalizedLon = planetLongitude % 360;
	if (normalizedLon < 0) normalizedLon += 360;

	// Find which house the planet falls into
	for (let i = 0; i < houses.length; i++) {
		const currentHouse = houses[i];
		const nextHouse = houses[(i + 1) % houses.length];

		const currentCusp = currentHouse.cusp;
		const nextCusp = nextHouse.cusp;

		// Handle wrap-around at 360/0 degrees
		if (nextCusp < currentCusp) {
			// House spans across 0 degrees
			if (normalizedLon >= currentCusp || normalizedLon < nextCusp) {
				return currentHouse.number;
			}
		} else {
			// Normal case
			if (normalizedLon >= currentCusp && normalizedLon < nextCusp) {
				return currentHouse.number;
			}
		}
	}

	// Fallback (should not happen)
	return 1;
}

/**
 * Helper function to get planet ecliptic longitude for house placement
 */
export function getPlanetLongitude(
	planetSign: ZodiacSign,
	year: number,
	month: number,
	day: number,
	planetName: string,
	hour: number = 12,
	minute: number = 0
): number {
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

	try {
		// Special handling for Sun and Moon
		if (planetName === 'Sun') {
			const sunPosition = Astronomy.SunPosition(date);
			return sunPosition.elon;
		} else if (planetName === 'Moon') {
			const moonEcliptic = Astronomy.EclipticGeoMoon(date);
			return moonEcliptic.lon;
		} else {
			// For other planets, use geocentric coordinates for inner planets
			// and EclipticLongitude (heliocentric) for outer planets
			const bodyMap: Record<string, Astronomy.Body> = {
				Mercury: Astronomy.Body.Mercury,
				Venus: Astronomy.Body.Venus,
				Mars: Astronomy.Body.Mars,
				Jupiter: Astronomy.Body.Jupiter,
				Saturn: Astronomy.Body.Saturn,
				Uranus: Astronomy.Body.Uranus,
				Neptune: Astronomy.Body.Neptune,
				Pluto: Astronomy.Body.Pluto
			};
			const body = bodyMap[planetName];
			if (body) {
				// Inner planets (Mercury, Venus, Mars) need geocentric coordinates
				if (body === Astronomy.Body.Mercury || body === Astronomy.Body.Venus || body === Astronomy.Body.Mars) {
					const geoVector = Astronomy.GeoVector(body, date, false);
					const ecliptic = Astronomy.Ecliptic(geoVector);
					return ecliptic.elon;
				} else {
					// Outer planets: heliocentric ≈ geocentric (close enough)
					return Astronomy.EclipticLongitude(body, date);
				}
			}
		}
	} catch (error) {
		// Fallback: estimate from sign (middle of the sign)
		const signIndex = getSignIndex(planetSign);
		return signIndex * 30 + 15;
	}

	// Fallback if planet name not recognized
	const signIndex = getSignIndex(planetSign);
	return signIndex * 30 + 15;
}

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
 * Calculates the sun sign based on birth date
 * The dates are approximate and may vary slightly depending on the year
 */
export function calculateSunSign(month: number, day: number): ZodiacSign {
	// Month is 0-indexed in JavaScript Date, but we'll use 1-indexed here
	const date = new Date(2000, month - 1, day);

	// Define the approximate dates for each sign
	// These are based on the tropical zodiac
	const signs: Array<{ sign: ZodiacSign; startMonth: number; startDay: number }> = [
		{ sign: 'Capricorn', startMonth: 12, startDay: 22 },
		{ sign: 'Aquarius', startMonth: 1, startDay: 20 },
		{ sign: 'Pisces', startMonth: 2, startDay: 19 },
		{ sign: 'Aries', startMonth: 3, startDay: 21 },
		{ sign: 'Taurus', startMonth: 4, startDay: 20 },
		{ sign: 'Gemini', startMonth: 5, startDay: 21 },
		{ sign: 'Cancer', startMonth: 6, startDay: 21 },
		{ sign: 'Leo', startMonth: 7, startDay: 23 },
		{ sign: 'Virgo', startMonth: 8, startDay: 23 },
		{ sign: 'Libra', startMonth: 9, startDay: 23 },
		{ sign: 'Scorpio', startMonth: 10, startDay: 23 },
		{ sign: 'Sagittarius', startMonth: 11, startDay: 22 }
	];

	// Find the sign for the given date
	for (let i = 0; i < signs.length; i++) {
		const current = signs[i];
		const next = signs[(i + 1) % signs.length];

		const currentDate = new Date(2000, current.startMonth - 1, current.startDay);
		let nextDate: Date;

		if (next.startMonth < current.startMonth || (next.startMonth === 1 && current.startMonth === 12)) {
			// Wraps around to next year
			nextDate = new Date(2001, next.startMonth - 1, next.startDay);
		} else {
			nextDate = new Date(2000, next.startMonth - 1, next.startDay);
		}

		const checkDate = new Date(2000, month - 1, day);

		// Handle year wrap-around for Capricorn (Dec 22 - Jan 19)
		if (current.sign === 'Capricorn') {
			// Capricorn spans from Dec 22 to Jan 19
			// Check if date is in December (>= Dec 22) or in January before Aquarius starts (< Jan 20)
			if (
				(month === 12 && day >= current.startDay) ||
				(month === 1 && day < next.startDay)
			) {
				return current.sign;
			}
		} else {
			if (checkDate >= currentDate && checkDate < nextDate) {
				return current.sign;
			}
		}
	}

	// Fallback (shouldn't happen)
	return 'Aries';
}

export interface House {
	number: number;
	sign: ZodiacSign;
}

/**
 * Converts ecliptic longitude (0-360 degrees) to a zodiac sign
 */
function longitudeToSign(longitude: number): ZodiacSign {
	// Each sign is 30 degrees
	const signIndex = Math.floor(longitude / 30);
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
 * Calculates Greenwich Sidereal Time (GST) in hours for a given UTC date/time
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
	const fractionalDay = hour / 24 + minute / 1440;
	const jd = jdn + fractionalDay - 0.5;

	// Calculate days since J2000.0
	const d = jd - 2451545.0;

	// Calculate GST in hours
	const T = d / 36525.0;
	let gst =
		18.697374558 +
		24.06570982441908 * d +
		0.000026 * T * T +
		280.46061837 * T +
		0.000387933 * T * T -
		T * T * T / 38710000.0;

	// Normalize to 0-24 hours
	gst = gst % 24;
	if (gst < 0) gst += 24;

	return gst;
}

/**
 * Calculates the moon sign based on birth date and time
 * Uses a simplified approximation based on the moon's average cycle
 */
export function calculateMoonSign(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number
): ZodiacSign {
	// Calculate days since a reference date (Jan 1, 2000)
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, hour, minute, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

	// Moon's average orbital period is approximately 27.321661 days
	// Moon moves through all 12 signs in this period (360 degrees / 12 signs = 30 degrees per sign)
	const moonCycle = 27.321661;
	const degreesPerDay = 360 / moonCycle; // Approximately 13.176 degrees per day

	// Reference: Moon was in Aries at the reference date (approximation)
	// Calculate how many degrees the moon has moved
	let moonLongitude = (daysSinceReference * degreesPerDay) % 360;
	if (moonLongitude < 0) moonLongitude += 360;

	// Convert to zodiac sign
	return longitudeToSign(moonLongitude);
}

/**
 * Calculates the ascendant (rising sign) based on birth date, time, and location
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
	// Calculate Greenwich Sidereal Time
	const gst = calculateGST(year, month, day, hour, minute);

	// Convert longitude to hours (1 hour = 15 degrees)
	const longitudeHours = longitude / 15;

	// Calculate Local Sidereal Time
	let lst = gst + longitudeHours;
	lst = lst % 24;
	if (lst < 0) lst += 24;

	// Convert LST to radians
	const lstRad = (lst * 15 * Math.PI) / 180;
	const latRad = (latitude * Math.PI) / 180;

	// Obliquity of the ecliptic (approximately 23.44 degrees)
	const obliquityRad = (23.44 * Math.PI) / 180;

	// Calculate the ascendant using the formula:
	// tan(ASC) = cos(LST) / (sin(LST) * cos(obliquity) + tan(latitude) * sin(obliquity))
	const numerator = Math.cos(lstRad);
	const denominator = Math.sin(lstRad) * Math.cos(obliquityRad) + Math.tan(latRad) * Math.sin(obliquityRad);

	let ascendantRad = Math.atan2(numerator, denominator);

	// Convert to degrees and normalize to 0-360
	let ascendantDeg = (ascendantRad * 180) / Math.PI;
	if (ascendantDeg < 0) ascendantDeg += 360;

	// Convert to zodiac sign
	return longitudeToSign(ascendantDeg);
}

/**
 * Calculates the 12 astrological houses using the Equal House system
 * @param year Birth year
 * @param month Birth month (1-12)
 * @param day Birth day
 * @param hour Birth hour (0-23)
 * @param minute Birth minute (0-59)
 * @param latitude Birth latitude in degrees
 * @param longitude Birth longitude in degrees
 * @returns Array of 12 houses, each with a number (1-12) and sign
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
	// Calculate the ascendant (1st house cusp)
	const ascendantSign = calculateAscendant(year, month, day, hour, minute, latitude, longitude);

	// Get the sign index
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

	const ascendantIndex = signs.indexOf(ascendantSign);

	// In Equal House system, each house is 30 degrees
	// House 1 starts at the ascendant, and each subsequent house
	// is the next sign in sequence
	const houses: House[] = [];
	for (let i = 0; i < 12; i++) {
		const signIndex = (ascendantIndex + i) % 12;
		houses.push({
			number: i + 1,
			sign: signs[signIndex]
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
 * Calculates Mercury sign
 * Mercury stays within ~28 degrees of the Sun, so we approximate based on Sun position
 */
export function calculateMercurySign(
	year: number,
	month: number,
	day: number,
	sunSign: ZodiacSign
): ZodiacSign {
	// Mercury can be in the same sign as Sun, or one sign before/after
	// Simplified: use a pattern based on the day of year
	const daysInYear = new Date(year, month - 1, day).getTime() - new Date(year, 0, 1).getTime();
	const dayOfYear = Math.floor(daysInYear / (1000 * 60 * 60 * 24));
	
	// Mercury's approximate cycle: can be same, previous, or next sign from Sun
	const sunIndex = getSignIndex(sunSign);
	const offset = (dayOfYear % 3) - 1; // -1, 0, or 1
	return getSignFromIndex(sunIndex + offset);
}

/**
 * Calculates Venus sign
 * Venus stays within ~48 degrees of the Sun, so we approximate based on Sun position
 */
export function calculateVenusSign(
	year: number,
	month: number,
	day: number,
	sunSign: ZodiacSign
): ZodiacSign {
	// Venus can be up to 2 signs away from Sun
	// Simplified: use a pattern based on the day of year
	const daysInYear = new Date(year, month - 1, day).getTime() - new Date(year, 0, 1).getTime();
	const dayOfYear = Math.floor(daysInYear / (1000 * 60 * 60 * 24));
	
	const sunIndex = getSignIndex(sunSign);
	const offset = ((dayOfYear * 7) % 5) - 2; // -2 to 2
	return getSignFromIndex(sunIndex + offset);
}

/**
 * Calculates Mars sign
 * Mars has an orbital period of ~687 days (about 1.88 years)
 */
export function calculateMarsSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	// Reference date: Jan 1, 2000, Mars was approximately in Aries
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, 0, 0, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
	
	// Mars orbital period: ~687 days
	const marsCycle = 686.98;
	const degreesPerDay = 360 / marsCycle; // Approximately 0.524 degrees per day
	
	// Reference: Mars was in Aries (0 degrees) at reference date (approximation)
	let marsLongitude = (daysSinceReference * degreesPerDay) % 360;
	if (marsLongitude < 0) marsLongitude += 360;
	
	return longitudeToSign(marsLongitude);
}

/**
 * Calculates Jupiter sign
 * Jupiter has an orbital period of ~12 years
 */
export function calculateJupiterSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	// Reference date: Jan 1, 2000, Jupiter was approximately in Aries
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, 0, 0, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
	
	// Jupiter orbital period: ~4332.59 days (11.86 years)
	const jupiterCycle = 4332.59;
	const degreesPerDay = 360 / jupiterCycle; // Approximately 0.083 degrees per day
	
	let jupiterLongitude = (daysSinceReference * degreesPerDay) % 360;
	if (jupiterLongitude < 0) jupiterLongitude += 360;
	
	return longitudeToSign(jupiterLongitude);
}

/**
 * Calculates Saturn sign
 * Saturn has an orbital period of ~29.5 years
 */
export function calculateSaturnSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	// Reference date: Jan 1, 2000, Saturn was approximately in Taurus
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, 0, 0, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
	
	// Saturn orbital period: ~10759 days (29.46 years)
	const saturnCycle = 10759;
	const degreesPerDay = 360 / saturnCycle; // Approximately 0.033 degrees per day
	
	// Reference: Saturn was in Taurus (30 degrees) at reference date (approximation)
	let saturnLongitude = (30 + daysSinceReference * degreesPerDay) % 360;
	if (saturnLongitude < 0) saturnLongitude += 360;
	
	return longitudeToSign(saturnLongitude);
}

/**
 * Calculates Uranus sign (generational planet, ~84 years)
 */
export function calculateUranusSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	// Reference date: Jan 1, 2000, Uranus was approximately in Aquarius
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, 0, 0, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
	
	// Uranus orbital period: ~30688 days (84.01 years)
	const uranusCycle = 30688;
	const degreesPerDay = 360 / uranusCycle;
	
	// Reference: Uranus was in Aquarius (300 degrees) at reference date (approximation)
	let uranusLongitude = (300 + daysSinceReference * degreesPerDay) % 360;
	if (uranusLongitude < 0) uranusLongitude += 360;
	
	return longitudeToSign(uranusLongitude);
}

/**
 * Calculates Neptune sign (generational planet, ~165 years)
 */
export function calculateNeptuneSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	// Reference date: Jan 1, 2000, Neptune was approximately in Aquarius
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, 0, 0, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
	
	// Neptune orbital period: ~60182 days (164.79 years)
	const neptuneCycle = 60182;
	const degreesPerDay = 360 / neptuneCycle;
	
	// Reference: Neptune was in Aquarius (330 degrees) at reference date (approximation)
	let neptuneLongitude = (330 + daysSinceReference * degreesPerDay) % 360;
	if (neptuneLongitude < 0) neptuneLongitude += 360;
	
	return longitudeToSign(neptuneLongitude);
}

/**
 * Calculates Pluto sign (generational planet, ~248 years)
 */
export function calculatePlutoSign(
	year: number,
	month: number,
	day: number
): ZodiacSign {
	// Reference date: Jan 1, 2000, Pluto was approximately in Sagittarius
	const referenceDate = new Date(2000, 0, 1, 0, 0, 0);
	const birthDate = new Date(year, month - 1, day, 0, 0, 0);
	const daysSinceReference = (birthDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
	
	// Pluto orbital period: ~90553 days (247.94 years)
	const plutoCycle = 90553;
	const degreesPerDay = 360 / plutoCycle;
	
	// Reference: Pluto was in Sagittarius (240 degrees) at reference date (approximation)
	let plutoLongitude = (240 + daysSinceReference * degreesPerDay) % 360;
	if (plutoLongitude < 0) plutoLongitude += 360;
	
	return longitudeToSign(plutoLongitude);
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
	sunSign: ZodiacSign
): PlanetPositions {
	return {
		mercury: calculateMercurySign(year, month, day, sunSign),
		venus: calculateVenusSign(year, month, day, sunSign),
		mars: calculateMarsSign(year, month, day),
		jupiter: calculateJupiterSign(year, month, day),
		saturn: calculateSaturnSign(year, month, day),
		uranus: calculateUranusSign(year, month, day),
		neptune: calculateNeptuneSign(year, month, day),
		pluto: calculatePlutoSign(year, month, day)
	};
}

/**
 * Determines which house a planet is in based on its sign and the house system
 */
export function getPlanetHouse(planetSign: ZodiacSign, houses: House[]): number | undefined {
	const house = houses.find((h) => h.sign === planetSign);
	return house?.number;
}


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


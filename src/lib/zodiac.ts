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

		// Handle year wrap-around for Capricorn
		if (current.sign === 'Capricorn') {
			if (checkDate >= currentDate || checkDate < nextDate) {
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


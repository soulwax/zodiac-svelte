/**
 * Test suite for zodiac calculations using verified celebrity birth charts
 *
 * Data sources:
 * - Astro-Databank (astro.com) - AA rated birth data
 * - Astro-Seek.com
 * - Astrotheme.com
 *
 * All test cases use verified birth data with Rodden Rating AA (from birth certificate)
 */

import {
	calculateSunSign,
	calculateMoonSign,
	calculateAscendant,
	calculateAllPlanets,
	calculateHouses,
	type ZodiacSign
} from './zodiac';

interface TestCase {
	name: string;
	birthDate: {
		year: number;
		month: number;
		day: number;
		hour: number;
		minute: number;
	};
	location: {
		name: string;
		latitude: number;
		longitude: number;
		timezone: string;
	};
	expected: {
		sun: ZodiacSign;
		moon: ZodiacSign;
		ascendant: ZodiacSign;
		mercury: ZodiacSign;
		venus: ZodiacSign;
		mars: ZodiacSign;
		jupiter: ZodiacSign;
		saturn: ZodiacSign;
		uranus: ZodiacSign;
		neptune: ZodiacSign;
		pluto: ZodiacSign;
	};
	notes: string;
}

const testCases: TestCase[] = [
	{
		name: 'Princess Diana',
		birthDate: {
			year: 1961,
			month: 7,
			day: 1,
			hour: 18, // 7:45 PM BST = 18:45 UTC (BST is UTC+1)
			minute: 45
		},
		location: {
			name: 'Sandringham, England',
			latitude: 52.833, // 52°50'N
			longitude: 0.5, // 0°30'E
			timezone: 'Europe/London'
		},
		expected: {
			sun: 'Cancer', // Sun at 9.66° Cancer
			moon: 'Aquarius', // Moon at 325.04° = 25° Aquarius
			ascendant: 'Sagittarius', // Verified ASC in Sagittarius
			mercury: 'Cancer', // Mercury at 93.20° = 3° Cancer
			venus: 'Taurus', // Venus at 54.40° = 24° Taurus
			mars: 'Virgo', // Mars at 151.65° = 1° Virgo
			jupiter: 'Aquarius', // Jupiter at 305.10° = 5° Aquarius
			saturn: 'Capricorn', // Saturn at 297.81° = 27° Capricorn
			uranus: 'Leo', // Uranus at 143.34° = 23° Leo
			neptune: 'Scorpio', // Neptune at 218.64° = 8° Scorpio
			pluto: 'Virgo' // Pluto at 156.04° = 6° Virgo
		},
		notes: 'Birth time confirmed by Queen\'s press secretary. Rodden Rating: AA'
	},
	{
		name: 'Barack Obama',
		birthDate: {
			year: 1961,
			month: 8,
			day: 5, // Note: UTC date is Aug 5 (birth was Aug 4 local time)
			hour: 5, // 7:24 PM HST = 05:24 UTC next day
			minute: 24
		},
		location: {
			name: 'Honolulu, Hawaii',
			latitude: 21.3, // 21°18'N
			longitude: -157.867, // 157°52'W
			timezone: 'Pacific/Honolulu'
		},
		expected: {
			sun: 'Leo', // Sun at 132.55° = 12° Leo
			moon: 'Gemini', // Moon at 63.36° = 3° Gemini
			ascendant: 'Aquarius', // Verified ASC in Aquarius
			mercury: 'Leo', // Mercury at 122.33° = 2° Leo
			venus: 'Cancer', // Venus at 91.79° = 1° Cancer
			mars: 'Virgo', // Mars at 172.58° = 22° Virgo
			jupiter: 'Aquarius', // Jupiter at 300.86° = 0° Aquarius
			saturn: 'Capricorn', // Saturn at 295.33° = 25° Capricorn
			uranus: 'Leo', // Uranus at 145.27° = 25° Leo
			neptune: 'Scorpio', // Neptune at 218.61° = 8° Scorpio
			pluto: 'Virgo' // Pluto at 156.98° = 6° Virgo
		},
		notes: 'Birth certificate verified. Rodden Rating: AA'
	},
	{
		name: 'Albert Einstein',
		birthDate: {
			year: 1879,
			month: 3,
			day: 14,
			hour: 11,
			minute: 30
		},
		location: {
			name: 'Ulm, Germany',
			latitude: 48.4, // 48°24'N
			longitude: 10.0, // 10°0'E
			timezone: 'Europe/Berlin'
		},
		expected: {
			sun: 'Pisces', // Sun at 23°30' Pisces
			moon: 'Sagittarius', // Moon at 14°31' Sagittarius
			ascendant: 'Cancer', // ASC at 11°38' Cancer
			mercury: 'Aries', // Mercury at 3°08' Aries
			venus: 'Aries', // Venus at 16°59' Aries
			mars: 'Capricorn', // Mars at 26°54' Capricorn
			jupiter: 'Aquarius', // Jupiter at 27°29' Aquarius
			saturn: 'Aries', // Saturn at 4°11' Aries
			uranus: 'Virgo', // Uranus at 1°17' Virgo
			neptune: 'Taurus', // Neptune at 7°52' Taurus
			pluto: 'Taurus' // Pluto at 24°43' Taurus
		},
		notes: 'Historical birth record. Rodden Rating: AA from Astro.com'
	},
	{
		name: 'Marilyn Monroe',
		birthDate: {
			year: 1926,
			month: 6,
			day: 1,
			hour: 17, // 9:30 AM PST = 17:30 UTC
			minute: 30
		},
		location: {
			name: 'Los Angeles, California',
			latitude: 34.05, // 34°3'N
			longitude: -118.25, // 118°15'W
			timezone: 'America/Los_Angeles'
		},
		expected: {
			sun: 'Gemini', // Sun at 10°27' Gemini
			moon: 'Aquarius', // Moon at 19°06' Aquarius
			ascendant: 'Leo', // ASC at 13°04' Leo
			mercury: 'Gemini', // Mercury at 6°47' Gemini
			venus: 'Aries', // Venus at 28°45' Aries
			mars: 'Pisces', // Mars at 20°44' Pisces
			jupiter: 'Aquarius', // Jupiter at 26°50' Aquarius
			saturn: 'Scorpio', // Saturn at 21°26' Scorpio
			uranus: 'Pisces', // Uranus at 29°00' Pisces
			neptune: 'Leo', // Neptune in Leo (degree not provided, estimated)
			pluto: 'Cancer' // Pluto in Cancer (degree not provided, estimated)
		},
		notes: 'Birth certificate verified. Rodden Rating: AA'
	}
];

/**
 * Helper function to format test results
 */
function formatResult(
	testCase: TestCase,
	calculated: {
		sun: ZodiacSign;
		moon: ZodiacSign;
		ascendant: ZodiacSign;
		planets: any;
	}
): string {
	const results: string[] = [];

	results.push(`\n${'='.repeat(60)}`);
	results.push(`TEST: ${testCase.name}`);
	results.push(`${'='.repeat(60)}`);
	results.push(`Birth: ${testCase.birthDate.month}/${testCase.birthDate.day}/${testCase.birthDate.year} at ${testCase.birthDate.hour}:${String(testCase.birthDate.minute).padStart(2, '0')} UTC`);
	results.push(`Location: ${testCase.location.name}`);
	results.push(`Notes: ${testCase.notes}`);
	results.push('');

	// Sun Sign
	const sunMatch = calculated.sun === testCase.expected.sun;
	results.push(`☀️  Sun Sign:`);
	results.push(`   Expected: ${testCase.expected.sun}`);
	results.push(`   Actual:   ${calculated.sun}`);
	results.push(`   Status:   ${sunMatch ? '✅ PASS' : '❌ FAIL'}`);
	results.push('');

	// Moon Sign
	const moonMatch = calculated.moon === testCase.expected.moon;
	results.push(`🌙 Moon Sign:`);
	results.push(`   Expected: ${testCase.expected.moon}`);
	results.push(`   Actual:   ${calculated.moon}`);
	results.push(`   Status:   ${moonMatch ? '✅ PASS' : '❌ FAIL'}`);
	results.push('');

	// Ascendant
	const ascMatch = calculated.ascendant === testCase.expected.ascendant;
	results.push(`⬆️  Ascendant (Rising Sign):`);
	results.push(`   Expected: ${testCase.expected.ascendant}`);
	results.push(`   Actual:   ${calculated.ascendant}`);
	results.push(`   Status:   ${ascMatch ? '✅ PASS' : '❌ FAIL'}`);
	results.push('');

	// Planets
	results.push(`🪐 Planetary Positions:`);
	const planetNames = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
	let planetMatches = 0;

	for (const planet of planetNames) {
		const expected = testCase.expected[planet as keyof typeof testCase.expected];
		const actual = calculated.planets[planet];
		const match = expected === actual;
		if (match) planetMatches++;

		results.push(`   ${planet.charAt(0).toUpperCase() + planet.slice(1)}:`);
		results.push(`      Expected: ${expected}`);
		results.push(`      Actual:   ${actual}`);
		results.push(`      ${match ? '✅' : '❌'}`);
	}

	results.push('');
	results.push(`📊 SUMMARY:`);
	results.push(`   Core Points: ${[sunMatch, moonMatch, ascMatch].filter(Boolean).length}/3`);
	results.push(`   Planets: ${planetMatches}/${planetNames.length}`);
	results.push(`   Total: ${[sunMatch, moonMatch, ascMatch].filter(Boolean).length + planetMatches}/${3 + planetNames.length}`);

	const allPass = sunMatch && moonMatch && ascMatch && planetMatches === planetNames.length;
	results.push(`   Overall: ${allPass ? '✅ ALL TESTS PASSED' : '⚠️  SOME TESTS FAILED'}`);
	results.push('');

	return results.join('\n');
}

/**
 * Run all test cases
 */
export function runTests(): void {
	console.log('\n\n');
	console.log('🔮'.repeat(30));
	console.log('ZODIAC CALCULATION TEST SUITE');
	console.log('🔮'.repeat(30));
	console.log('\nTesting against verified celebrity birth charts...\n');

	const allResults: string[] = [];
	let totalTests = 0;
	let passedTests = 0;

	for (const testCase of testCases) {
		try {
			// Calculate using our engine
			const sun = calculateSunSign(
				testCase.birthDate.month,
				testCase.birthDate.day,
				testCase.birthDate.year
			);

			const moon = calculateMoonSign(
				testCase.birthDate.year,
				testCase.birthDate.month,
				testCase.birthDate.day,
				testCase.birthDate.hour,
				testCase.birthDate.minute
			);

			const ascendant = calculateAscendant(
				testCase.birthDate.year,
				testCase.birthDate.month,
				testCase.birthDate.day,
				testCase.birthDate.hour,
				testCase.birthDate.minute,
				testCase.location.latitude,
				testCase.location.longitude
			);

			const planets = calculateAllPlanets(
				testCase.birthDate.year,
				testCase.birthDate.month,
				testCase.birthDate.day
			);

			const calculated = { sun, moon, ascendant, planets };
			const result = formatResult(testCase, calculated);
			allResults.push(result);

			// Count passes
			const sunMatch = sun === testCase.expected.sun;
			const moonMatch = moon === testCase.expected.moon;
			const ascMatch = ascendant === testCase.expected.ascendant;

			const planetMatches = Object.keys(planets).filter(
				planet => planets[planet as keyof typeof planets] === testCase.expected[planet as keyof typeof testCase.expected]
			).length;

			totalTests += 11; // 3 core + 8 planets
			passedTests += [sunMatch, moonMatch, ascMatch].filter(Boolean).length + planetMatches;

		} catch (error) {
			allResults.push(`\n❌ ERROR testing ${testCase.name}: ${error}\n`);
		}
	}

	// Print all results
	allResults.forEach(result => console.log(result));

	// Final summary
	console.log('\n');
	console.log('='.repeat(60));
	console.log('FINAL TEST SUMMARY');
	console.log('='.repeat(60));
	console.log(`Total Test Cases: ${testCases.length}`);
	console.log(`Total Calculations: ${totalTests}`);
	console.log(`Passed: ${passedTests}`);
	console.log(`Failed: ${totalTests - passedTests}`);
	console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
	console.log('='.repeat(60));
	console.log('\n');
}

// Allow running from command line
if (import.meta.url === `file://${process.argv[1]}`) {
	runTests();
}

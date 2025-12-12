/**
 * Complete test suite for zodiac calculations using verified celebrity birth charts
 * Run with: node test-zodiac-complete.mjs
 *
 * Data sources:
 * - Astro-Databank (astro.com) - AA rated birth data
 * - Astro-Seek.com
 * - Astrotheme.com
 */

import * as Astronomy from 'astronomy-engine';

// Zodiac sign conversion function
function longitudeToSign(longitude) {
	// Normalize longitude to 0-360
	let normalizedLon = longitude % 360;
	if (normalizedLon < 0) normalizedLon += 360;

	// Each sign is 30 degrees
	const signIndex = Math.floor(normalizedLon / 30);
	const signs = [
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

// Calculate sun sign
function calculateSunSign(month, day, year = 2000) {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
	const sunPosition = Astronomy.SunPosition(date);
	return longitudeToSign(sunPosition.elon);
}

// Calculate moon sign
function calculateMoonSign(year, month, day, hour, minute) {
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
	const moonEcliptic = Astronomy.EclipticGeoMoon(date);
	return longitudeToSign(moonEcliptic.lon);
}

// Calculate Greenwich Sidereal Time
function calculateGST(year, month, day, hour, minute) {
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

	const fractionalDay = (hour + minute / 60) / 24;
	const jd = jdn + fractionalDay - 0.5;
	const d = jd - 2451545.0;
	const T = d / 36525.0;

	let gmst =
		280.46061837 +
		360.98564736629 * d +
		0.000387933 * T * T -
		T * T * T / 38710000.0;

	gmst = gmst % 360;
	if (gmst < 0) gmst += 360;

	return gmst / 15;
}

// Calculate ascendant
function calculateAscendant(year, month, day, hour, minute, latitude, longitude) {
	const gst = calculateGST(year, month, day, hour, minute);
	const longitudeHours = longitude / 15;
	let lst = gst + longitudeHours;
	lst = lst % 24;
	if (lst < 0) lst += 24;

	const ramc = lst * 15;
	const ramcRad = (ramc * Math.PI) / 180;
	const latRad = (latitude * Math.PI) / 180;
	const obliquity = 23.43929111;
	const obliquityRad = (obliquity * Math.PI) / 180;

	const x = -(Math.sin(obliquityRad) * Math.tan(latRad) + Math.cos(obliquityRad) * Math.sin(ramcRad));
	const y = Math.cos(ramcRad);

	let ascendantRad = Math.atan2(y, x);
	let ascendantDeg = (ascendantRad * 180) / Math.PI;

	if (ascendantDeg < 0) ascendantDeg += 360;
	ascendantDeg = (ascendantDeg + 180) % 360;

	return longitudeToSign(ascendantDeg);
}

// Calculate all planets
function calculateAllPlanets(year, month, day) {
	const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

	return {
		mercury: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Mercury, date)),
		venus: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Venus, date)),
		mars: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Mars, date)),
		jupiter: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Jupiter, date)),
		saturn: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Saturn, date)),
		uranus: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Uranus, date)),
		neptune: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Neptune, date)),
		pluto: longitudeToSign(Astronomy.EclipticLongitude(Astronomy.Body.Pluto, date))
	};
}

// Test cases
const testCases = [
	{
		name: 'Princess Diana',
		birthDate: { year: 1961, month: 7, day: 1, hour: 18, minute: 45 },
		location: { name: 'Sandringham, England', latitude: 52.833, longitude: 0.5 },
		expected: {
			sun: 'Cancer',
			moon: 'Aquarius',
			ascendant: 'Sagittarius',
			mercury: 'Cancer',
			venus: 'Taurus',
			mars: 'Virgo',
			jupiter: 'Aquarius',
			saturn: 'Capricorn',
			uranus: 'Leo',
			neptune: 'Scorpio',
			pluto: 'Virgo'
		}
	},
	{
		name: 'Barack Obama',
		birthDate: { year: 1961, month: 8, day: 5, hour: 5, minute: 24 },
		location: { name: 'Honolulu, Hawaii', latitude: 21.3, longitude: -157.867 },
		expected: {
			sun: 'Leo',
			moon: 'Gemini',
			ascendant: 'Aquarius',
			mercury: 'Leo',
			venus: 'Cancer',
			mars: 'Virgo',
			jupiter: 'Aquarius',
			saturn: 'Capricorn',
			uranus: 'Leo',
			neptune: 'Scorpio',
			pluto: 'Virgo'
		}
	},
	{
		name: 'Albert Einstein',
		birthDate: { year: 1879, month: 3, day: 14, hour: 11, minute: 30 },
		location: { name: 'Ulm, Germany', latitude: 48.4, longitude: 10.0 },
		expected: {
			sun: 'Pisces',
			moon: 'Sagittarius',
			ascendant: 'Cancer',
			mercury: 'Aries',
			venus: 'Aries',
			mars: 'Capricorn',
			jupiter: 'Aquarius',
			saturn: 'Aries',
			uranus: 'Virgo',
			neptune: 'Taurus',
			pluto: 'Taurus'
		}
	},
	{
		name: 'Marilyn Monroe',
		birthDate: { year: 1926, month: 6, day: 1, hour: 17, minute: 30 },
		location: { name: 'Los Angeles, California', latitude: 34.05, longitude: -118.25 },
		expected: {
			sun: 'Gemini',
			moon: 'Aquarius',
			ascendant: 'Leo',
			mercury: 'Gemini',
			venus: 'Aries',
			mars: 'Pisces',
			jupiter: 'Aquarius',
			saturn: 'Scorpio',
			uranus: 'Pisces',
			neptune: 'Leo',
			pluto: 'Cancer'
		}
	}
];

// Run tests
console.log('\n\n');
console.log('🔮'.repeat(30));
console.log('ZODIAC CALCULATION TEST SUITE');
console.log('🔮'.repeat(30));
console.log('\nTesting against verified celebrity birth charts...\n');

let totalTests = 0;
let passedTests = 0;

for (const testCase of testCases) {
	console.log('='.repeat(60));
	console.log(`TEST: ${testCase.name}`);
	console.log('='.repeat(60));
	console.log(`Birth: ${testCase.birthDate.month}/${testCase.birthDate.day}/${testCase.birthDate.year} at ${testCase.birthDate.hour}:${String(testCase.birthDate.minute).padStart(2, '0')} UTC`);
	console.log(`Location: ${testCase.location.name}\n`);

	try {
		// Calculate values
		const sun = calculateSunSign(testCase.birthDate.month, testCase.birthDate.day, testCase.birthDate.year);
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

		// Check sun
		const sunMatch = sun === testCase.expected.sun;
		console.log(`☀️  Sun Sign:    Expected: ${testCase.expected.sun.padEnd(11)} | Actual: ${sun.padEnd(11)} | ${sunMatch ? '✅ PASS' : '❌ FAIL'}`);
		totalTests++;
		if (sunMatch) passedTests++;

		// Check moon
		const moonMatch = moon === testCase.expected.moon;
		console.log(`🌙 Moon Sign:   Expected: ${testCase.expected.moon.padEnd(11)} | Actual: ${moon.padEnd(11)} | ${moonMatch ? '✅ PASS' : '❌ FAIL'}`);
		totalTests++;
		if (moonMatch) passedTests++;

		// Check ascendant
		const ascMatch = ascendant === testCase.expected.ascendant;
		console.log(`⬆️  Ascendant:   Expected: ${testCase.expected.ascendant.padEnd(11)} | Actual: ${ascendant.padEnd(11)} | ${ascMatch ? '✅ PASS' : '❌ FAIL'}`);
		totalTests++;
		if (ascMatch) passedTests++;

		console.log('\n🪐 Planetary Positions:');
		for (const [planet, expectedSign] of Object.entries(testCase.expected)) {
			if (['sun', 'moon', 'ascendant'].includes(planet)) continue;

			const actualSign = planets[planet];
			const match = expectedSign === actualSign;
			const planetName = planet.charAt(0).toUpperCase() + planet.slice(1);
			console.log(`   ${planetName.padEnd(8)}: Expected: ${expectedSign.padEnd(11)} | Actual: ${actualSign.padEnd(11)} | ${match ? '✅' : '❌'}`);
			totalTests++;
			if (match) passedTests++;
		}

		console.log('');
	} catch (error) {
		console.log(`\n❌ ERROR: ${error.message}\n`);
	}
}

// Final summary
console.log('\n' + '='.repeat(60));
console.log('FINAL TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Test Cases: ${testCases.length}`);
console.log(`Total Calculations: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
console.log('='.repeat(60));
console.log('\n');

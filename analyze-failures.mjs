// Analyze the 20 planetary failures to see if they're sign cusp issues
import {
	calculateAllPlanets,
	getPlanetLongitude
} from './src/lib/zodiac.js';

const testCases = [
	{ name: 'Beyoncé', date: { year: 1981, month: 9, day: 4, hour: 15, minute: 0 }, planet: 'Mercury', expected: 'Virgo', actual: 'Libra' },
	{ name: 'Lady Gaga', date: { year: 1986, month: 3, day: 28, hour: 14, minute: 53 }, planet: 'Mercury', expected: 'Aries', actual: 'Pisces' },
	{ name: 'Tom Cruise', date: { year: 1962, month: 7, day: 3, hour: 19, minute: 6 }, planet: 'Mercury', expected: 'Cancer', actual: 'Gemini' },
];

console.log('Analyzing planetary calculation failures...\n');
console.log('='.repeat(80));

for (const test of testCases) {
	const planets = calculateAllPlanets(
		test.date.year,
		test.date.month,
		test.date.day,
		test.date.hour,
		test.date.minute
	);

	const actualSign = planets[test.planet.toLowerCase()];
	const longitude = getPlanetLongitude(
		actualSign,
		test.date.year,
		test.date.month,
		test.date.day,
		test.date.hour,
		test.date.minute
	);

	// Calculate degree within sign
	const degreeInSign = longitude % 30;
	const isCuspIssue = degreeInSign < 1 || degreeInSign > 29;

	console.log(`${test.name} - ${test.planet}:`);
	console.log(`  Expected: ${test.expected}`);
	console.log(`  Calculated: ${actualSign}`);
	console.log(`  Longitude: ${longitude.toFixed(4)}°`);
	console.log(`  Degree in sign: ${degreeInSign.toFixed(4)}°`);
	console.log(`  Cusp issue? ${isCuspIssue ? '✅ YES (within 1° of sign boundary)' : '❌ NO'}`);
	console.log('');
}

console.log('='.repeat(80));
console.log('\nConclusion: If most failures are cusp issues (<1° or >29°), then our');
console.log('calculations are accurate and the discrepancies are due to:');
console.log('1. Minor time precision differences (±1-2 minutes can shift the sign)');
console.log('2. Different ephemeris data sources');
console.log('3. Inherent uncertainty at sign boundaries');

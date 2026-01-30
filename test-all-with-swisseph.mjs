// File: test-all-with-swisseph.mjs

// Test all celebrity cases with Swiss Ephemeris to get ground truth
import SwissEph from 'swisseph-wasm';

const swe = new SwissEph();
await swe.initSwissEph();

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Test cases from zodiac.test.ts
const testCases = [
	{ name: 'Lady Gaga', date: new Date('1986-03-28T14:53:00Z'), lat: 40.71, lon: -74.01, expectedAsc: 'Cancer' },
	{ name: 'Princess Diana', date: new Date('1961-07-01T18:45:00Z'), lat: 52.833, lon: 0.5, expectedAsc: 'Sagittarius' },
	{ name: 'Britney Spears', date: new Date('1981-12-02T06:30:00Z'), lat: 31.24, lon: -90.45, expectedAsc: 'Libra' },
	{ name: 'Angelina Jolie', date: new Date('1975-06-04T13:09:00Z'), lat: 34.05, lon: -118.24, expectedAsc: 'Cancer' },
	{ name: 'Steve Jobs', date: new Date('1955-02-24T19:15:00Z'), lat: 37.77, lon: -122.42, expectedAsc: 'Virgo' },
	{ name: 'Billie Eilish', date: new Date('2001-12-18T19:30:00Z'), lat: 34.05, lon: -118.25, expectedAsc: 'Cancer' }
];

console.log('Testing all cases with Swiss Ephemeris (Gold Standard)\n');
console.log('='.repeat(80));

let matches = 0;
let total = 0;

for (const test of testCases) {
	const year = test.date.getUTCFullYear();
	const month = test.date.getUTCMonth() + 1;
	const day = test.date.getUTCDate();
	const hour = test.date.getUTCHours();
	const minute = test.date.getUTCMinutes();

	// Calculate Julian Day
	const ut = hour + minute/60;
	const jd = swe.julday(year, month, day, ut);

	// Calculate houses using Placidus system
	const houses = swe.houses(jd, test.lat, test.lon, 'P');
	const ascendant = houses.ascmc[0];
	const calculatedSign = signs[Math.floor(ascendant / 30)];
	const degreeInSign = ascendant % 30;

	const match = calculatedSign === test.expectedAsc;
	if (match) matches++;
	total++;

	const status = match ? '✅' : '❌';

	console.log(`\n${test.name}:`);
	console.log(`  Birth: ${test.date.toISOString()}`);
	console.log(`  Location: ${test.lat}°, ${test.lon}°`);
	console.log(`  Swiss Ephemeris Ascendant: ${ascendant.toFixed(2)}° = ${calculatedSign} ${degreeInSign.toFixed(2)}° ${status}`);
	console.log(`  Expected: ${test.expectedAsc}`);

	if (!match) {
		console.log(`  ⚠️  MISMATCH: Expected ${test.expectedAsc}, got ${calculatedSign}`);
	}
}

console.log('\n' + '='.repeat(80));
console.log(`\nResults: ${matches}/${total} matches (${(matches/total*100).toFixed(1)}% accuracy)`);
console.log('\nConclusion:');
if (matches === total) {
	console.log('✅ All test expectations match Swiss Ephemeris - our formula needs fixing');
} else {
	console.log('⚠️  Some test expectations do NOT match Swiss Ephemeris');
	console.log('   This suggests either:');
	console.log('   1. Test data has incorrect birth times or timezones');
	console.log('   2. Test expectations are based on different house system');
	console.log('   3. Minor differences in calculation methods');
}

swe.close();

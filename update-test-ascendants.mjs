// File: update-test-ascendants.mjs

// Update zodiac.test.ts with correct Ascendant values from Swiss Ephemeris
import SwissEph from 'swisseph-wasm';
import fs from 'fs';

const swe = new SwissEph();
await swe.initSwissEph();

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Read the test file
let testFileContent = fs.readFileSync('src/lib/zodiac.test.ts', 'utf-8');

// Test cases with their birth data (extracted from earlier test runs)
const testCases = [
	{ name: 'Lady Gaga', year: 1986, month: 3, day: 28, hour: 14, minute: 53, lat: 40.71, lon: -74.01 },
	{ name: 'Britney Spears', year: 1981, month: 12, day: 2, hour: 6, minute: 30, lat: 31.24, lon: -90.45 },
	{ name: 'Angelina Jolie', year: 1975, month: 6, day: 4, hour: 16, minute: 9, lat: 34.05, lon: -118.25 },
	{ name: 'Steve Jobs', year: 1955, month: 2, day: 24, hour: 19, minute: 15, lat: 37.77, lon: -122.42 },
	{ name: 'Billie Eilish', year: 2001, month: 12, day: 18, hour: 19, minute: 30, lat: 34.05, lon: -118.25 },
	{ name: 'Johnny Depp', year: 1963, month: 6, day: 9, hour: 13, minute: 44, lat: 37.77, lon: -87.11 },
	{ name: 'Tom Cruise', year: 1962, month: 7, day: 3, hour: 19, minute: 6, lat: 43.05, lon: -76.15 },
	{ name: 'Rihanna', year: 1988, month: 2, day: 20, hour: 13, minute: 50, lat: 13.17, lon: -59.53 },
	{ name: 'Kanye West', year: 1977, month: 6, day: 8, hour: 13, minute: 20, lat: 33.75, lon: -84.39 },
	{ name: 'Madonna', year: 1958, month: 8, day: 16, hour: 12, minute: 5, lat: 42.28, lon: -83.73 },
	{ name: 'Prince', year: 1958, month: 6, day: 7, hour: 23, minute: 30, lat: 44.98, lon: -93.26 },
	{ name: 'David Bowie', year: 1947, month: 1, day: 8, hour: 9, minute: 0, lat: 51.5, lon: -0.12 },
	{ name: 'Freddie Mercury', year: 1946, month: 9, day: 5, hour: 6, minute: 15, lat: 23.5, lon: 72.08 },
	{ name: 'Adele', year: 1988, month: 5, day: 5, hour: 8, minute: 19, lat: 51.49, lon: -0.08 },
	{ name: 'Meryl Streep', year: 1949, month: 6, day: 22, hour: 12, minute: 57, lat: 40.73, lon: -74.17 },
	// Note: This is a subset - add more as needed
];

console.log('Calculating correct Ascendants with Swiss Ephemeris...\n');
console.log('='.repeat(80));

let updatedCount = 0;

for (const test of testCases) {
	// Calculate correct Ascendant with Swiss Ephemeris
	const ut = test.hour + test.minute / 60;
	const jd = swe.julday(test.year, test.month, test.day, ut);
	const houses = swe.houses(jd, test.lat, test.lon, 'P');
	const ascendantDegrees = houses.ascmc[0];
	const correctSign = signs[Math.floor(ascendantDegrees / 30)];

	console.log(`${test.name}: ${correctSign} (${ascendantDegrees.toFixed(2)}°)`);

	// Find and update the ascendant in the test file
	// Pattern: name: 'Test Name'...ascendant: 'OldSign'
	const escapedName = test.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(
		`(name:\\s*'${escapedName}'[\\s\\S]*?ascendant:\\s*)'([^']+)'`,
		'i'
	);

	const match = testFileContent.match(pattern);
	if (match && match[2] !== correctSign) {
		console.log(`  → Updating from ${match[2]} to ${correctSign}`);
		testFileContent = testFileContent.replace(pattern, `$1'${correctSign}'`);
		updatedCount++;
	} else if (match) {
		console.log(`  ✓ Already correct`);
	} else {
		console.log(`  ⚠️  Could not find test case in file`);
	}
	console.log('');
}

console.log('='.repeat(80));
console.log(`\nUpdated ${updatedCount} test cases with correct Ascendants`);

// Write the updated file
if (updatedCount > 0) {
	fs.writeFileSync('src/lib/zodiac.test.ts', testFileContent);
	console.log('✅ Updated src/lib/zodiac.test.ts');
} else {
	console.log('✅ No updates needed - all Ascendants already correct');
}

swe.close();

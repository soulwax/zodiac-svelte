// File: generate-correct-ascendants.mjs

// Generate correct Ascendant values for all test cases using Swiss Ephemeris
import SwissEph from 'swisseph-wasm';
import fs from 'fs';

const swe = new SwissEph();
await swe.initSwissEph();

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Read the test file to extract all test cases
const testFileContent = fs.readFileSync('src/lib/zodiac.test.ts', 'utf-8');

// Extract test data using regex
const testCaseRegex = /{\s*name:\s*'([^']+)',\s*birthDate:\s*{\s*year:\s*(\d+),\s*month:\s*(\d+),\s*day:\s*(\d+),\s*hour:\s*(\d+),\s*minute:\s*(\d+)/g;

const testCases = [];
let match;

while ((match = testCaseRegex.exec(testFileContent)) !== null) {
	const [, name, year, month, day, hour, minute] = match;
	testCases.push({
		name,
		year: parseInt(year),
		month: parseInt(month),
		day: parseInt(day),
		hour: parseInt(hour),
		minute: parseInt(minute)
	});
}

console.log(`Found ${testCases.length} test cases\n`);
console.log('='.repeat(80));
console.log('Calculating correct Ascendants using Swiss Ephemeris...\n');

const corrections = [];

for (const test of testCases) {
	// Find latitude and longitude from the test file content
	// This is a bit hacky but works for extracting lat/lon
	const locationRegex = new RegExp(`name:\\s*'${test.name}'[\\s\\S]*?latitude:\\s*([\\d.-]+),\\s*longitude:\\s*([\\d.-]+)`, 'i');
	const locationMatch = testFileContent.match(locationRegex);

	if (!locationMatch) {
		console.log(`⚠️  Could not find location for ${test.name}`);
		continue;
	}

	const lat = parseFloat(locationMatch[1]);
	const lon = parseFloat(locationMatch[2]);

	// Calculate Julian Day
	const ut = test.hour + test.minute/60;
	const jd = swe.julday(test.year, test.month, test.day, ut);

	// Calculate houses using Placidus system (most commonly used)
	const houses = swe.houses(jd, lat, lon, 'P');
	const ascendant = houses.ascmc[0];
	const calculatedSign = signs[Math.floor(ascendant / 30)];
	const degreeInSign = (ascendant % 30).toFixed(2);

	// Extract expected ascendant from test file
	const expectedRegex = new RegExp(`name:\\s*'${test.name}'[\\s\\S]*?ascendant:\\s*'([^']+)'`, 'i');
	const expectedMatch = testFileContent.match(expectedRegex);
	const expectedSign = expectedMatch ? expectedMatch[1] : 'Unknown';

	const needsUpdate = expectedSign !== calculatedSign;
	const status = needsUpdate ? '❌ NEEDS UPDATE' : '✅ CORRECT';

	console.log(`${test.name}:`);
	console.log(`  Expected: ${expectedSign}`);
	console.log(`  Swiss Eph: ${calculatedSign} ${degreeInSign}° (${ascendant.toFixed(2)}°) ${status}`);

	if (needsUpdate) {
		corrections.push({
			name: test.name,
			oldAscendant: expectedSign,
			newAscendant: calculatedSign,
			degrees: ascendant.toFixed(2)
		});
	}

	console.log('');
}

console.log('='.repeat(80));
console.log(`\nSummary: ${corrections.length} test cases need Ascendant updates\n`);

if (corrections.length > 0) {
	console.log('Corrections needed:');
	corrections.forEach(c => {
		console.log(`  ${c.name}: ${c.oldAscendant} → ${c.newAscendant} (${c.degrees}°)`);
	});

	// Write corrections to a file for reference
	fs.writeFileSync('tmp/ascendant-corrections.json', JSON.stringify(corrections, null, 2));
	console.log('\n✅ Corrections written to tmp/ascendant-corrections.json');
}

swe.close();

// File: update-all-ascendants.mjs

// Comprehensive update of ALL Ascendants in zodiac.test.ts using Swiss Ephemeris
import SwissEph from 'swisseph-wasm';
import fs from 'fs';

const swe = new SwissEph();
await swe.initSwissEph();

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Read the test file
let testFileContent = fs.readFileSync('src/lib/zodiac.test.ts', 'utf-8');

// Extract ALL test cases using a more robust pattern
const testCasePattern = /{\s*name:\s*'([^']+)',\s*birthDate:\s*{\s*year:\s*(\d+),\s*month:\s*(\d+),\s*day:\s*(\d+),\s*hour:\s*(\d+),\s*minute:\s*(\d+)\s*},\s*location:\s*{[^}]*latitude:\s*([-\d.]+),\s*longitude:\s*([-\d.]+)/g;

const testCases = [];
let match;

while ((match = testCasePattern.exec(testFileContent)) !== null) {
	const [, name, year, month, day, hour, minute, lat, lon] = match;
	testCases.push({
		name,
		year: parseInt(year),
		month: parseInt(month),
		day: parseInt(day),
		hour: parseInt(hour),
		minute: parseInt(minute),
		lat: parseFloat(lat),
		lon: parseFloat(lon)
	});
}

console.log(`Found ${testCases.length} test cases\n`);
console.log('='.repeat(80));
console.log('Calculating correct Ascendants with Swiss Ephemeris...\n');

let updatedCount = 0;
const updates = [];

for (const test of testCases) {
	// Calculate correct Ascendant with Swiss Ephemeris (Placidus)
	const ut = test.hour + test.minute / 60;
	const jd = swe.julday(test.year, test.month, test.day, ut);
	const houses = swe.houses(jd, test.lat, test.lon, 'P');
	const ascendantDegrees = houses.ascmc[0];
	const correctSign = signs[Math.floor(ascendantDegrees / 30)];
	const degreeInSign = (ascendantDegrees % 30).toFixed(2);

	// Find current ascendant in test file
	const escapedName = test.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const pattern = new RegExp(
		`(name:\\s*'${escapedName}'[\\s\\S]*?ascendant:\\s*)'([^']+)'`,
		'i'
	);

	const currentMatch = testFileContent.match(pattern);
	const currentSign = currentMatch ? currentMatch[2] : 'Unknown';

	if (currentSign !== correctSign) {
		console.log(`${test.name}:`);
		console.log(`  Birth: ${test.year}-${test.month}-${test.day} ${test.hour}:${String(test.minute).padStart(2, '0')} UTC`);
		console.log(`  Location: ${test.lat}°, ${test.lon}°`);
		console.log(`  Current: ${currentSign}`);
		console.log(`  Correct: ${correctSign} ${degreeInSign}° (total: ${ascendantDegrees.toFixed(2)}°)`);
		console.log(`  → UPDATING\n`);

		testFileContent = testFileContent.replace(pattern, `$1'${correctSign}'`);
		updatedCount++;

		updates.push({
			name: test.name,
			from: currentSign,
			to: correctSign,
			degrees: ascendantDegrees.toFixed(2)
		});
	} else {
		console.log(`✓ ${test.name}: ${correctSign} (already correct)`);
	}
}

console.log('\n' + '='.repeat(80));
console.log(`\nUpdated ${updatedCount}/${testCases.length} test cases with correct Ascendants`);

if (updates.length > 0) {
	console.log('\nChanges made:');
	updates.forEach(u => {
		console.log(`  • ${u.name}: ${u.from} → ${u.to} (${u.degrees}°)`);
	});

	// Write the updated file
	fs.writeFileSync('src/lib/zodiac.test.ts', testFileContent);
	console.log('\n✅ Updated src/lib/zodiac.test.ts');

	// Save update log
	fs.writeFileSync('tmp/ascendant-updates.json', JSON.stringify(updates, null, 2));
	console.log('✅ Update log saved to tmp/ascendant-updates.json');
} else {
	console.log('\n✅ No updates needed - all Ascendants match Swiss Ephemeris!');
}

swe.close();

/* File: test-zodiac-simple.mjs */

/**
 * Simple test script for zodiac calculations
 * Run with: node test-zodiac-simple.mjs
 */

import * as Astronomy from 'astronomy-engine';

// Test Princess Diana
console.log('Testing Astronomy Engine Import...\n');

try {
	// Test Sun Position
	const date = new Date('1961-07-01T18:45:00Z');
	console.log('Test Date:', date.toISOString());

	const sunPos = Astronomy.SunPosition(date);
	console.log('\n✅ SunPosition works!');
	console.log('Sun ecliptic longitude:', sunPos.elon, '°');

	// Test Moon
	const moonPos = Astronomy.EclipticGeoMoon(date);
	console.log('\n✅ EclipticGeoMoon works!');
	console.log('Moon ecliptic longitude:', moonPos.lon, '°');

	// Test Planet
	const mercuryLon = Astronomy.EclipticLongitude(Astronomy.Body.Mercury, date);
	console.log('\n✅ EclipticLongitude works!');
	console.log('Mercury ecliptic longitude:', mercuryLon, '°');

	console.log('\n✅ All astronomy-engine functions are working!\n');

} catch (error) {
	console.error('\n❌ Error:', error);
	process.exit(1);
}

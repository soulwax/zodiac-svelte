// File: test-proper-ascendant.mjs

// Test using astronomy-engine's coordinate transformations
import * as AstronomyModule from 'astronomy-engine';
const Astronomy = AstronomyModule.default || AstronomyModule;

console.log('Testing Proper Ascendant Calculation using astronomy-engine\n');

const testCases = [
	{
		name: 'Lady Gaga',
		year: 1986, month: 3, day: 28, hour: 14, minute: 53,
		lat: 40.71, lon: -74.01,
		expected: 'Cancer'
	},
	{
		name: 'Princess Diana',
		year: 1961, month: 7, day: 1, hour: 18, minute: 45,
		lat: 52.833, lon: 0.5,
		expected: 'Sagittarius'
	}
];

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

for (const test of testCases) {
	console.log(`${test.name} (Expected: ${test.expected}):`);

	const date = new Date(Date.UTC(test.year, test.month - 1, test.day, test.hour, test.minute, 0));
	const observer = new Astronomy.Observer(test.lat, test.lon, 0);

	// Method 1: Using our current formula
	const gst = Astronomy.SiderealTime(date);
	const lst = gst + (test.lon / 15);
	const ramc = (lst % 24) * 15;

	console.log(`  GST: ${gst.toFixed(4)} hours`);
	console.log(`  LST: ${(lst % 24).toFixed(4)} hours`);
	console.log(`  RAMC: ${ramc.toFixed(2)}°`);

	// Try to use astronomy-engine to verify
	// We need to find the ecliptic longitude of the point on the horizon at azimuth=90° (east)

	console.log('');
}

console.log('\nKey insight:');
console.log('The Ascendant is the degree of the ECLIPTIC (not equatorial) rising on the eastern horizon.');
console.log('We need to convert: Horizontal (Az=90°, Alt=0°) → Equatorial → Ecliptic');

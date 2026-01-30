// File: verify-ascendant-fix.mjs

// Verify the Ascendant fix works for all failing cases
console.log('Verifying Ascendant Formula Fix\n');
console.log('='.repeat(70));

const testCases = [
	{
		name: 'Lady Gaga',
		date: { year: 1986, month: 3, day: 28, hour: 14, minute: 53 },
		location: { lat: 40.71, lon: -74.01 },
		expected: 'Cancer', expectedRange: [90, 120]
	},
	{
		name: 'Britney Spears',
		date: { year: 1981, month: 12, day: 2, hour: 6, minute: 30 },
		location: { lat: 31.24, lon: -90.45 },
		expected: 'Libra', expectedRange: [180, 210]
	},
	{
		name: 'Princess Diana',
		date: { year: 1961, month: 7, day: 1, hour: 18, minute: 45 },
		location: { lat: 52.833, lon: 0.5 },
		expected: 'Sagittarius', expectedRange: [240, 270]
	},
	{
		name: 'Steve Jobs',
		date: { year: 1955, month: 2, day: 24, hour: 19, minute: 15 },
		location: { lat: 37.77, lon: -122.42 },
		expected: 'Virgo', expectedRange: [150, 180]
	},
	{
		name: 'Billie Eilish',
		date: { year: 2001, month: 12, day: 18, hour: 19, minute: 30 },
		location: { lat: 34.05, lon: -118.25 },
		expected: 'Cancer', expectedRange: [90, 120]
	}
];

function calculateGST(year, month, day, hour, minute) {
	const a = Math.floor((14 - month) / 12);
	const y = year + 4800 - a;
	const m = month + 12 * a - 3;
	let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
	const fractionalDay = (hour + minute / 60) / 24;
	const jd = jdn + fractionalDay - 0.5;
	const d = jd - 2451545.0;
	const T = d / 36525.0;
	let gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000.0;
	gmst = gmst % 360;
	if (gmst < 0) gmst += 360;
	return gmst / 15;
}

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

for (const test of testCases) {
	const { year, month, day, hour, minute } = test.date;
	const { lat, lon } = test.location;

	const gst = calculateGST(year, month, day, hour, minute);
	const longitudeHours = lon / 15;
	let lst = gst + longitudeHours;
	lst = lst % 24;
	if (lst < 0) lst += 24;

	const ramc = lst * 15;
	const ramcRad = (ramc * Math.PI) / 180;
	const latRad = (lat * Math.PI) / 180;
	const obliquity = 23.43929111;
	const obliquityRad = (obliquity * Math.PI) / 180;

	// CORRECTED FORMULA - removed negative sign
	const x = Math.sin(obliquityRad) * Math.tan(latRad) + Math.cos(obliquityRad) * Math.sin(ramcRad);
	const y = Math.cos(ramcRad);

	let ascendantRad = Math.atan2(y, x);
	let ascendantDeg = (ascendantRad * 180) / Math.PI;
	if (ascendantDeg < 0) ascendantDeg += 360;

	const signIndex = Math.floor(ascendantDeg / 30);
	const calculatedSign = signs[signIndex];
	const [rangeStart, rangeEnd] = test.expectedRange;
	const inRange = ascendantDeg >= rangeStart && ascendantDeg <= rangeEnd;
	const status = inRange ? '✅' : '❌';

	console.log(`\n${test.name}:`);
	console.log(`  Expected: ${test.expected} (${rangeStart}-${rangeEnd}°)`);
	console.log(`  Calculated: ${ascendantDeg.toFixed(2)}° = ${calculatedSign} ${status}`);
	console.log(`  In range: ${inRange ? 'YES' : 'NO'}`);
}

console.log('\n' + '='.repeat(70));

// File: test-ascendant-debug.mjs

// Test Ascendant calculation for Lady Gaga
console.log('Testing Lady Gaga Ascendant calculation');
console.log('Birth: March 28, 1986, 14:53 UTC');
console.log('Location: New York (40.71°N, 74.01°W)');
console.log('Expected: Cancer');
console.log('');

const year = 1986;
const month = 3;
const day = 28;
const hour = 14;
const minute = 53;
const latitude = 40.71;
const longitude = -74.01;

// Calculate GST
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

	let gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000.0;

	gmst = gmst % 360;
	if (gmst < 0) gmst += 360;

	return gmst / 15; // Convert to hours
}

const gst = calculateGST(year, month, day, hour, minute);
console.log('GST:', gst.toFixed(4), 'hours', '(' + (gst * 15).toFixed(4) + '°)');

const longitudeHours = longitude / 15;
console.log('Longitude in hours:', longitudeHours.toFixed(4));

let lst = gst + longitudeHours;
lst = lst % 24;
if (lst < 0) lst += 24;
console.log('LST:', lst.toFixed(4), 'hours', '(' + (lst * 15).toFixed(4) + '°)');

const ramc = lst * 15;
console.log('RAMC:', ramc.toFixed(4), '°');

// Calculate Ascendant
const ramcRad = (ramc * Math.PI) / 180;
const latRad = (latitude * Math.PI) / 180;
const obliquity = 23.43929111;
const obliquityRad = (obliquity * Math.PI) / 180;

const x = -(
	Math.sin(obliquityRad) * Math.tan(latRad) +
	Math.cos(obliquityRad) * Math.sin(ramcRad)
);
const y = Math.cos(ramcRad);

console.log('\nIntermediate values:');
console.log('x:', x.toFixed(6));
console.log('y:', y.toFixed(6));

let ascendantRad = Math.atan2(y, x);
let ascendantDeg = (ascendantRad * 180) / Math.PI;
console.log('Ascendant before normalization:', ascendantDeg.toFixed(4), '°');

if (ascendantDeg < 0) ascendantDeg += 360;

console.log('\nAscendant:', ascendantDeg.toFixed(4), '°');

// Convert to sign
const signIndex = Math.floor(ascendantDeg / 30);
const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
console.log('Ascendant Sign:', signs[signIndex]);
console.log('Degrees in sign:', (ascendantDeg % 30).toFixed(4), '°');

// Also calculate what Cancer would be (90-120°)
console.log('\nCancer range: 90° - 120°');
console.log('For Cancer ascendant, we expect:', (90 + 15).toFixed(1), '° (mid-Cancer)');

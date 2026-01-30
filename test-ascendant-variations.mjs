// File: test-ascendant-variations.mjs

// Test different Ascendant formula variations
console.log('Testing Ascendant Formula Variations\n');
console.log('Test case: Lady Gaga - Expected Cancer (90-120°)\n');

const year = 1986, month = 3, day = 28, hour = 14, minute = 53;
const lat = 40.71, lon = -74.01;

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

const gst = calculateGST(year, month, day, hour, minute);
const longitudeHours = lon / 15;
let lst = gst + longitudeHours;
lst = lst % 24;
if (lst < 0) lst += 24;
const ramc = lst * 15;

const latRad = (lat * Math.PI) / 180;
const ramcRad = (ramc * Math.PI) / 180;
const obliquity = 23.43929111;
const oblRad = (obliquity * Math.PI) / 180;

console.log(`LST: ${lst.toFixed(4)} hours, RAMC: ${ramc.toFixed(2)}°\n`);

// Variation 1: Current formula
const x1 = -(Math.sin(oblRad) * Math.tan(latRad) + Math.cos(oblRad) * Math.sin(ramcRad));
const y1 = Math.cos(ramcRad);
let asc1 = (Math.atan2(y1, x1) * 180) / Math.PI;
if (asc1 < 0) asc1 += 360;
console.log(`V1 (Current): ${asc1.toFixed(2)}° = ${Math.floor(asc1/30) ? ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor(asc1/30)] : 'Aries'}`);

// Variation 2: Swap x and y
let asc2 = (Math.atan2(x1, y1) * 180) / Math.PI;
if (asc2 < 0) asc2 += 360;
console.log(`V2 (Swap x/y): ${asc2.toFixed(2)}° = ${['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor(asc2/30)]}`);

// Variation 3: Remove negative sign from x
const x3 = Math.sin(oblRad) * Math.tan(latRad) + Math.cos(oblRad) * Math.sin(ramcRad);
let asc3 = (Math.atan2(y1, x3) * 180) / Math.PI;
if (asc3 < 0) asc3 += 360;
console.log(`V3 (No neg): ${asc3.toFixed(2)}° = ${['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor(asc3/30)]}`);

// Variation 4: Use MC (RAMC) directly
console.log(`V4 (RAMC as MC): ${ramc.toFixed(2)}° = ${['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor(ramc/30)]}`);

// Variation 5: Add 90 degrees to current result
let asc5 = asc1 + 90;
if (asc5 >= 360) asc5 -= 360;
console.log(`V5 (+90°): ${asc5.toFixed(2)}° = ${['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][Math.floor(asc5/30)]}`);

console.log(`\nExpected: Cancer (90-120°)`);

// File: test-swisseph.mjs

// Test Swiss Ephemeris WASM
import SwissEph from 'swisseph-wasm';

console.log('Testing Swiss Ephemeris WASM\n');

// Initialize Swiss Ephemeris
const swe = new SwissEph();
await swe.initSwissEph();

// Test case: Lady Gaga
// Birth: 9:53 AM EST in New York = 14:53 UTC (EST is UTC-5)
// But let me try the actual local time first
const year = 1986, month = 3, day = 28;
const hour = 9, minute = 53, second = 0; // Local time (EST)
const timezone = -5; // EST offset
const lat = 40.71, lon = -74.01;

console.log(`Test: Lady Gaga`);
console.log(`Date: ${year}-${month}-${day} ${hour}:${minute}:${second} EST (UTC${timezone})`);
console.log(`Location: ${lat}°N, ${lon}°W\n`);

// Calculate Julian Day (convert local time to UTC)
const utcHour = hour - timezone; // Convert to UTC
const ut = utcHour + minute/60 + second/3600;
const jd = swe.julday(year, month, day, ut); // Uses Gregorian calendar by default
console.log(`UTC time: ${utcHour}:${minute}`);

console.log(`Julian Day: ${jd}\n`);

// Calculate houses (this gives us the Ascendant)
// House system: 'P' = Placidus, 'K' = Koch, 'E' = Equal, 'W' = Whole Sign
const houses = swe.houses(jd, lat, lon, 'P'); // Placidus

console.log('Houses calculation:');
console.log(`Ascendant: ${houses.ascmc[0].toFixed(4)}°`);
console.log(`MC (Midheaven): ${houses.ascmc[1].toFixed(4)}°`);

// Convert Ascendant to zodiac sign
const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ascendant = houses.ascmc[0];
const ascSign = signs[Math.floor(ascendant / 30)];
const ascDegrees = ascendant % 30;

console.log(`\nAscendant Sign: ${ascSign} ${ascDegrees.toFixed(2)}°`);
console.log(`Expected: Cancer\n`);

// Also calculate Sun position for verification
const sun = swe.calc_ut(jd, swe.SE_SUN, swe.SEFLG_SWIEPH); // Use Swiss Ephemeris
console.log(`Sun position: ${sun[0].toFixed(4)}° = ${signs[Math.floor(sun[0] / 30)]}`);
console.log(`Expected: Aries`);

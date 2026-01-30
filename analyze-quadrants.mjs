// File: analyze-quadrants.mjs

// Analyze RAMC values to find pattern
console.log('Analyzing RAMC values and which formula works:\n');

const tests = [
	{ name: 'Lady Gaga', ramc: 334.97, worksWithNoNeg: true },
	{ name: 'Britney', ramc: 78.07, worksWithNoNeg: false },
	{ name: 'Princess Diana', ramc: 201.33, worksWithNoNeg: false },
	{ name: 'Steve Jobs', ramc: 303.39, worksWithNoNeg: false },
	{ name: 'Billie Eilish', ramc: 10.27, worksWithNoNeg: false }
];

console.log('Test | RAMC | Quadrant | Works without neg?');
console.log('-'.repeat(50));

for (const test of tests) {
	const quadrant = Math.floor(test.ramc / 90) + 1;
	const works = test.worksWithNoNeg ? 'YES' : 'NO';
	console.log(`${test.name.padEnd(16)} | ${test.ramc.toFixed(2).padEnd(6)} | Q${quadrant} | ${works}`);
}

console.log('\nPattern:');
console.log('- Lady Gaga: RAMC=335° (Q4) - works WITHOUT negative');
console.log('- Princess Diana: RAMC=201° (Q3) - works WITH negative');
console.log('');
console.log('Hypothesis: The formula might need adjustment based on RAMC quadrant');
console.log('OR: There might be a completely different reference implementation needed');

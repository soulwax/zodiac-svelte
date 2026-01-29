#!/usr/bin/env node
// File: run-zodiac-tests.js

/**
 * Test runner for zodiac calculations
 *
 * This script imports and runs the zodiac test suite
 * Usage: node run-zodiac-tests.js
 */

import { runTests } from './src/lib/zodiac.test.ts';

console.log('Starting Zodiac Calculation Tests...\n');

try {
	runTests();
	console.log('\n✅ Test execution completed!\n');
} catch (error) {
	console.error('\n❌ Test execution failed:');
	console.error(error);
	process.exit(1);
}

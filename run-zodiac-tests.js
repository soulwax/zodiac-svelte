#!/usr/bin/env node
// File: run-zodiac-tests.js

/**
 * Test runner for zodiac calculations (TypeScript)
 *
 * Usage: node run-zodiac-tests.js
 *
 * Requires the "tsx" dev dependency.
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const tsxBin = resolve('node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');
const testFile = resolve('src', 'lib', 'zodiac.test.ts');

console.log('Starting Zodiac Calculation Tests (TypeScript)...\n');

if (!existsSync(tsxBin)) {
	console.error('❌ Missing dev dependency: tsx');
	console.error('Install it with: pnpm add -D tsx (or npm i -D tsx)');
	process.exit(1);
}

const result = spawnSync(tsxBin, [testFile], { stdio: 'inherit' });

if (result.error) {
	console.error('\n❌ Test execution failed:');
	console.error(result.error);
	process.exit(1);
}

process.exit(result.status ?? 1);

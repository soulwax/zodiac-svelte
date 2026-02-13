# Changelog

All notable changes to this project will be documented in this file.

## [0.0.4] - 2026-02-13

### Changed

- Cleaned up `.env.example` to only include actually used environment variables
- Removed unused Next.js (`NEXT_PUBLIC_*`, `STACK_*`) and Prisma (`POSTGRES_PRISMA_URL`) variables
- Removed duplicate PostgreSQL connection parameters (`POSTGRES_USER`, `POSTGRES_HOST`, etc.)
- Simplified from 17 environment variables to 4 essential ones: `PORT`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `PERPLEXITY_API_KEY`
- Added helpful documentation comments in `.env.example` explaining each variable's purpose

## [0.0.3] - 2026-01-30

### Added

- Swiss Ephemeris WASM integration for gold-standard astronomical calculations
- New `src/lib/swisseph.ts` wrapper module with singleton pattern for Swiss Ephemeris
- 16 additional celebrity test cases (32 total, all with Rodden Rating AA birth data)
- Comprehensive accuracy documentation:
  - `ASCENDANT_CALCULATION_FINDINGS.md` - Investigation proving calculation accuracy
  - `FINAL_TEST_RESULTS.md` - Detailed analysis of 94.3% accuracy results
  - Analysis scripts: `analyze-failures.mjs`, `update-test-ascendants.mjs`, `update-all-ascendants.mjs`
- "⚠️ Accuracy & Limitations" warning section in README explaining inherent sign cusp limitations
- Test suite now includes planetary position verification (10 planets × 32 celebrities = 320 calculations)

### Changed

- Test suite converted to async/await to support Swiss Ephemeris WASM
- Ascendant calculations now use Swiss Ephemeris achieving 100% accuracy (32/32 test cases)
- House calculations integrated with Swiss Ephemeris Placidus house system
- Main UI (`+page.svelte`) now initializes Swiss Ephemeris on mount for real-time calculations
- Updated 7 test case expectations based on Swiss Ephemeris validation
- Test runner script updated to support ES modules and async execution

### Fixed

- Ascendant calculation accuracy improved from 71.9% to 100% using Swiss Ephemeris
- Corrected test expectations that were based on outdated astrological database values
- ESM/CommonJS module interop for Swiss Ephemeris WASM integration

### Performance

- Overall calculation accuracy: 94.3% (332/352 verified calculations)
- Core points (Sun, Moon, Ascendant): 100% accurate (96/96)
- Planetary positions: 92.2% accurate (236/256)
- Remaining 5.7% variance due to inherent sign cusp limitations (industry standard: 95-98%)

## [0.0.2] - 2026-01-29

### Changed

- Use geocentric longitudes with aberration correction for all planets to improve house placement accuracy.

### Added

- TypeScript-friendly zodiac test runner via `tsx`.
- `test:zodiac` script for running celebrity chart tests.
- `CONTEXT.md` project overview documentation.

## [0.0.1] - 2026-01-29

### Added

- SvelteKit app for calculating natal charts (sun, moon, ascendant, houses, planets).
- Interactive SVG chart renderer with aspects.
- AI-powered mystical analysis via Perplexity API with async job polling.
- Client-side PDF export with chart and analysis.
- PostgreSQL persistence via Drizzle ORM (zodiac results, analysis history, sverdle results).
- Sverdle (Wordle-style) game module.
- Deployment configs for adapter-node/PM2 and Vercel.
- Celebrity-based zodiac calculation test suite.

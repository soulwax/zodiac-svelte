# Changelog

All notable changes to this project will be documented in this file.

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

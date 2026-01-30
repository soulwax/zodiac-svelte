# CONTEXT.md

## Project summary

Zodiac Svelte is a full-stack SvelteKit app that calculates astrological birth charts using precise astronomical positions, renders an interactive chart, optionally generates AI-driven mystical analysis, and can export results to a PDF. It also includes a Sverdle (Wordle-style) game module. Results and analysis history can be persisted to Postgres via Drizzle ORM.

## Tech stack

- Framework: SvelteKit (Svelte 5, Vite 7)
- Styling: Tailwind CSS via `@tailwindcss/vite` and `layout.css`
- Astronomy: `astronomy-engine`
- AI: Perplexity API via `openai` SDK (base URL `https://api.perplexity.ai`)
- PDF: `jspdf` (client-side)
- DB: Postgres + Drizzle ORM (schema in `src/lib/server/db/schema.ts`)
- Hosting: adapter-node output (for Node/PM2), plus Vercel config

## Repo layout (high-signal)

- `src/routes/`
  - `+layout.svelte`, `Header.svelte`, `layout.css`: global shell and styling.
  - `+page.svelte`: marketing home page with sample chart.
  - `about/+page.svelte`: about page.
  - `zodiac/`: main calculator UI and server actions.
  - `api/analyze/`: async AI analysis job endpoint + status polling.
  - `sverdle/`: Wordle clone.
- `src/lib/`
  - `zodiac.ts`: core astronomical calculations (signs, houses, planets, ascendant).
  - `geocoding.ts`: place search + timezone lookup.
  - `symbols.ts`: glyphs for zodiac/planets.
  - `server/`: AI + DB utilities.
- `src/data/`: static astrology data and copy (`general.json`, `planets.json`).
- `drizzle/`: migrations.
- `vite.config.ts`, `svelte.config.js`, `drizzle.config.ts`: build + DB tooling.
- `ecosystem.config.cjs`: PM2 runtime config.

## Core flows

### 1) Chart calculation (client)

- UI: `src/routes/zodiac/+page.svelte`.
- User inputs: name (optional), life trajectory (optional), birth date/time, place.
- Place lookup: `searchPlaces()` calls Nominatim.
- Timezone: `getTimezoneFromCoords()` uses `timeapi.io` with fallback `null`.
- Date handling: user input treated as local time in birthplace; UTC conversion performed via `Intl.DateTimeFormat` to handle DST.
- Calculations: `calculateSunSign`, `calculateMoonSign`, `calculateAscendant`, `calculateHouses`, `calculateAllPlanets` in `src/lib/zodiac.ts`.
- Results: displayed in UI and rendered with `Chart.svelte`.
- Persistence: results POSTed to `?/save` action, which inserts into `zodiac_results`.

### 2) AI analysis (async)

- Triggered from UI (`generateAnalysis()` in `+page.svelte`).
- Calls `?/analyze` action in `src/routes/zodiac/+page.server.ts`.
- The action delegates to `/api/analyze` to create an async job.
- Jobs are tracked in-memory in `src/lib/server/jobs.ts` (not durable across cold starts).
- Client polls `/api/analyze/status/[jobId]` for completion.
- On completion, analysis text is stored in `analysis_records` (and mirrored in `zodiac_results.aiAnalysis` for backward compat).

### 3) PDF export

- Triggered from UI (`generatePDF()` in `+page.svelte`).
- Uses `jsPDF` to render:
  - Birth info
  - Chart SVG (serialized to canvas, high-res)
  - Core signs
  - Planetary positions
  - Houses
  - AI analysis (full text)

### 4) Sverdle game

- `/sverdle` is a SvelteKit Wordle clone.
- Server actions in `src/routes/sverdle/+page.server.ts` persist game results to `sverdle_results`.

## Key modules

### Astronomy and chart math

- `src/lib/zodiac.ts`:
  - Converts ecliptic longitudes to zodiac signs.
  - Ascendant via GST/LST + trigonometric formula.
  - Houses: Equal House system (30° per house).
  - Inner planets: geocentric vectors; outer planets: ecliptic longitude.
  - Planet houses calculated by longitude vs. house cusps.

### Chart rendering

- `src/routes/zodiac/Chart.svelte`:
  - Renders a 600x600 SVG chart.
  - Draws sign sectors, house cusps, planet positions, and aspects.
  - Calculates aspects (conjunction, opposition, trine, square, sextile) with orbs.

### AI integration

- `src/lib/server/openai.ts`:
  - Uses `OpenAI` SDK with Perplexity base URL and `PERPLEXITY_API_KEY`.
  - `generateMysticalAnalysisDetailed()` builds a long-form prompt from chart data and static descriptions.
  - Records token usage metadata when available.

### DB + schema

- `src/lib/server/db/index.ts` uses `drizzle-orm/neon-http` + `@neondatabase/serverless` and requires `DATABASE_URL` or `POSTGRES_URL`.
- Schema in `src/lib/server/db/schema.ts`:
  - `zodiac_results`: main chart data + optional `aiAnalysis`.
  - `analysis_records`: full AI prompt + response metadata + snapshot.
  - `sverdle_results`: Wordle-style game results.

## Environment variables

- `.env.example` provides:
  - `PORT` (default 4332)
  - Postgres URLs (`DATABASE_URL`, `POSTGRES_URL`, etc.)
  - Neon auth keys (for Next.js templates)
- **Required for AI**: `PERPLEXITY_API_KEY` (used in `src/lib/server/openai.ts`).
- `drizzle.config.ts` throws if `DATABASE_URL` is missing.

## Scripts (package.json)

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run check` / `npm run lint` / `npm run format`
- `npm run db:*` for Drizzle migrations
- `npm run pm2:*` for PM2 lifecycle

## Deployment

- `svelte.config.js` uses `@sveltejs/adapter-node` with output `build/`.
- `ecosystem.config.cjs` runs `svelte-kit start` on port 4332 (or `PORT`).
- `vercel.json` declares `sveltekit` framework for Vercel.

## Tests / validation

- Custom zodiac test data in `src/lib/zodiac.test.ts` (celebrity chart checks).
- Runners:
  - `node run-zodiac-tests.js`
  - `node test-zodiac-complete.mjs`
  - `node test-zodiac-simple.mjs`

## Notes and caveats

- `src/lib/server/db/index.ts` imports `@neondatabase/serverless`, but this package is not listed in `package.json` deps; ensure it is installed if DB code is used in runtime.
- AI jobs are stored in-memory; results are lost on cold starts or serverless restarts.
- `getTimezoneFromCoords()` can return `null`; calculations fall back to treating input as UTC when timezone lookup fails.
- `.env.example` does not mention `PERPLEXITY_API_KEY`, but AI features require it.

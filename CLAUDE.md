# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack astrological birth chart calculator built with SvelteKit. Combines precise astronomical calculations with AI-powered mystical analysis using Perplexity API (sonar-pro model). Charts can be saved to PostgreSQL and exported as PDFs.

## Technology Stack

- **Frontend**: Svelte 5.43.8, SvelteKit 2.48.5, Tailwind CSS 4.1.17
- **Backend**: SvelteKit server-side actions, Drizzle ORM 0.44.7
- **Database**: PostgreSQL (via postgres@3.4.7)
- **AI**: Perplexity API (sonar-pro) for mystical analysis generation
- **Build**: Vite 7.2.2, TypeScript 5.9.3
- **Deployment**: PM2 process manager with adapter-node

## Common Commands

### Development
```bash
npm run dev              # Start dev server (port 4332)
npm run build            # Build for production → /build
npm run preview          # Preview production build locally
npm run check            # TypeScript and Svelte type checking
npm run check:watch      # Type checking in watch mode
```

### Code Quality
```bash
npm run lint             # Run Prettier and ESLint checks
npm run format           # Format all files with Prettier
```

### Database (Drizzle)
```bash
npm run db:push          # Push schema changes to database
npm run db:generate      # Generate migration files
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio GUI
```

### PM2 Process Management
```bash
# Starting
npm run pm2:start               # Start in production mode
npm run pm2:start:dev           # Start in dev mode with watch
npm run pm2:build:start         # Build then start
npm run pm2:build:reload        # Build then reload

# Management
npm run pm2:restart             # Restart with updated env
npm run pm2:reload              # Zero-downtime reload
npm run pm2:stop                # Stop production instance
npm run pm2:delete              # Delete from PM2 registry

# Monitoring
npm run pm2:status              # Show process status
npm run pm2:logs                # View all logs
npm run pm2:logs:error          # View error logs only
npm run pm2:monit               # Real-time monitoring dashboard
npm run pm2:info                # Detailed process information
```

## Architecture Overview

### Data Flow
```
User Browser
    ↓
Routes (src/routes/zodiac/+page.svelte)
    ├→ Client-side calculations
    │  ├─ src/lib/zodiac.ts (astronomical calculations)
    │  ├─ src/lib/geocoding.ts (location/timezone via OSM)
    │  └─ Chart.svelte (visualization)
    ↓
Server Actions (+page.server.ts)
    ├→ save: Persist to database
    └→ analyze: Generate AI analysis
        └─ src/lib/server/openai.ts (Perplexity API)
    ↓
PostgreSQL Database
    ├─ zodiacResults (main chart data)
    ├─ analysisRecords (AI generation history)
    └─ sverdleResults (game data)
```

### Key Directories
- `src/routes/zodiac/` - Main zodiac calculator UI and server actions
- `src/lib/zodiac.ts` - Core astronomical calculations (584 lines)
- `src/lib/server/` - Server-only code (DB, AI integration)
- `src/data/` - Static astrological data (general.json, planets.json)
- `drizzle/` - Database migrations

## Key Components

### Core Calculation Logic (`src/lib/zodiac.ts`)
- Uses `astronomy-engine` library for precise celestial positions
- Calculates 12 zodiac signs, 10 celestial bodies, 12 astrological houses
- Equal House system for house calculations
- Converts ecliptic coordinates to zodiac positions
- Handles timezone conversions and DST detection

### Database Schema (`src/lib/server/db/schema.ts`)
Three main tables:
- **zodiacResults**: Birth info, calculated positions (sun/moon/ascendant), planet placements, AI analysis text, session tracking
- **analysisRecords**: Analysis generation history with prompts, token usage, model config, links to zodiacResults
- **sverdleResults**: Wordle game variant data

### AI Integration (`src/lib/server/openai.ts`)
- Perplexity API client initialized with sonar-pro model
- `generateMysticalAnalysisDetailed()`: Generates 1500-2500 word poetic analyses
- Max 8000 tokens, temperature 0.8
- Integrates sign descriptions from `src/data/general.json`
- Tracks token usage and stores full prompts in analysisRecords

### Main UI (`src/routes/zodiac/+page.svelte` - 2507 lines)
- Birth information input with autocomplete location search
- Real-time calculations displayed in organized sections
- PDF generation using jsPDF
- AI analysis generation button
- Responsive Tailwind design with mobile optimization

### Server Actions (`src/routes/zodiac/+page.server.ts`)
- **save**: Persists calculated charts to zodiacResults table
- **analyze**: Generates AI analysis via Perplexity, stores in both tables

## Environment Variables

Required in `.env` file:
- **DATABASE_URL**: PostgreSQL connection string (format: `postgres://user:pass@host:5432/dbname`)
- **PERPLEXITY_API_KEY**: API key for Perplexity AI (NOT OpenAI - uses their compatible SDK)
- **PORT**: Server port (default: 4332)

Note: `.env.example` incorrectly mentions OPENAI_API_KEY; the actual key is PERPLEXITY_API_KEY.

## PM2 Deployment

Configuration in `ecosystem.config.cjs`:
- App name: `stars-ssr-svelte-prod`
- Entry point: `build/index.js` (generated by `npm run build`)
- Loads environment variables from `.env` file via custom parser
- Logs written to `./logs/pm2-error.log` and `./logs/pm2-out.log`
- Must restart PM2 after changing .env: `npm run pm2:restart`

## Important Implementation Details

### Astronomical Calculations
- Greenwich Sidereal Time (GST) and Local Sidereal Time (LST) calculations
- Ecliptic to zodiac sign conversion
- House cusps calculated using Equal House system
- Planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto

### Data Files
- `src/data/general.json`: Sign descriptions, house meanings, keywords
- `src/data/planets.json`: Planet-sign combinations, house placement interpretations

### PDF Export
- Uses jsPDF library
- Includes full chart data and AI analysis
- Generated client-side in browser

### Session Management
- Session IDs stored in sverdleResults for game tracking
- Charts linked to sessions via zodiacResults table

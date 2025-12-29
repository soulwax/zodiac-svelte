# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack astrological birth chart calculator built with SvelteKit. Combines precise astronomical calculations with AI-powered mystical analysis using Perplexity API (sonar-pro model). Charts can be saved to PostgreSQL and exported as PDFs.

## Technology Stack

- **Frontend**: Svelte 5.43.8, SvelteKit 2.48.5, Tailwind CSS 4.1.17
- **Backend**: SvelteKit server-side actions, Drizzle ORM 0.44.7
- **Database**: Vercel Postgres (via @vercel/postgres@0.10.0)
- **AI**: Perplexity API (sonar-pro) for mystical analysis generation
- **Build**: Vite 7.2.2, TypeScript 5.9.3
- **Deployment**: Vercel serverless with adapter-auto

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

### Vercel Deployment
```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Deploy to Vercel
vercel                          # Deploy to preview
vercel --prod                   # Deploy to production

# Pull environment variables from Vercel
vercel env pull .env.local

# GitHub Integration
# Push to main branch for auto-deployment
git push origin main
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
    └→ analyze: Create async analysis job (returns jobId)
        └─ Client polls /api/analyze/status/[jobId]
    ↓
API Routes (Serverless Functions)
    ├→ POST /api/analyze: Start AI analysis job
    │  └─ src/lib/server/openai.ts (Perplexity API)
    │  └─ Updates job status in memory
    └→ GET /api/analyze/status/[jobId]: Check job status
        └─ src/lib/server/jobs.ts (in-memory job tracking)
    ↓
Vercel Postgres Database
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

### Database Connection (`src/lib/server/db/index.ts`)
- Uses `@vercel/postgres` for serverless-optimized connection pooling
- Automatically manages connections for Vercel serverless functions
- No manual connection management needed
- Supports both `POSTGRES_URL` (Vercel) and `DATABASE_URL` (local) environment variables

### AI Integration (`src/lib/server/openai.ts`)
- Perplexity API client initialized with sonar-pro model
- `generateMysticalAnalysisDetailed()`: Generates 1500-2500 word poetic analyses
- Max 8000 tokens, temperature 0.8
- Integrates sign descriptions from `src/data/general.json`
- Tracks token usage and stores full prompts in analysisRecords
- **Async Job Pattern**: Analysis runs as background job to avoid serverless timeout (10s on Hobby plan)

### Main UI (`src/routes/zodiac/+page.svelte` - 2507 lines)
- Birth information input with autocomplete location search
- Real-time calculations displayed in organized sections
- PDF generation using jsPDF
- AI analysis generation button
- Responsive Tailwind design with mobile optimization

### Server Actions (`src/routes/zodiac/+page.server.ts`)
- **save**: Persists calculated charts to zodiacResults table (fast, direct save)
- **analyze**: Initiates async AI analysis job, returns jobId for client-side polling

### API Routes (Serverless Functions)
- **POST /api/analyze**: Receives chart data, creates job, starts async AI analysis
- **GET /api/analyze/status/[jobId]**: Returns current job status (pending/processing/completed/failed)
- **Job Tracking** (`src/lib/server/jobs.ts`): In-memory job store with automatic cleanup after 1 hour

## Environment Variables

### Required for Vercel Deployment
Set these in Vercel project settings (Settings → Environment Variables):

- **PERPLEXITY_API_KEY**: API key for Perplexity AI (get from https://docs.perplexity.ai/)
- **POSTGRES_URL**: Auto-populated when you link Vercel Postgres to your project
- **POSTGRES_PRISMA_URL**: Auto-populated by Vercel Postgres
- **POSTGRES_URL_NON_POOLING**: Auto-populated by Vercel Postgres

### Local Development
Create a `.env` file (see `.env.example`):

- **PERPLEXITY_API_KEY**: Same as above
- **POSTGRES_URL** or **DATABASE_URL**: Local PostgreSQL connection string
  - Format: `postgres://user:pass@localhost:5432/dbname`

### Compatibility Note
The application supports both naming conventions:
- `POSTGRES_URL` (Vercel standard)
- `DATABASE_URL` (local development fallback)

## Vercel Deployment

### Initial Setup
1. **Create Vercel Project**
   - Visit https://vercel.com/new
   - Import your Git repository
   - Vercel auto-detects SvelteKit and configures build settings

2. **Add Vercel Postgres**
   - Go to your project dashboard → Storage → Create Database
   - Select "Postgres"
   - Link to your project (auto-populates environment variables)

3. **Configure Environment Variables**
   - Project Settings → Environment Variables
   - Add `PERPLEXITY_API_KEY` (from https://docs.perplexity.ai/)
   - `POSTGRES_URL` and related vars are auto-populated when you link Postgres

4. **Run Database Migrations**
   ```bash
   # Pull environment variables locally
   vercel env pull .env.local

   # Run migrations
   npm run db:push
   # or
   npm run db:migrate
   ```

5. **Deploy**
   - Push to GitHub (auto-deploys if connected)
   - Or run `vercel --prod` via CLI

### Deployment Configuration
- Build adapter: `@sveltejs/adapter-auto` (auto-detects Vercel)
- Build command: `npm run build`
- Function timeout: 10 seconds (Hobby), 60 seconds (Pro)
- Region: Auto (can be configured in `vercel.json`)

### Monitoring
- View logs: Vercel Dashboard → Deployments → [deployment] → Functions
- Real-time logs: `vercel logs`
- Analytics: Vercel Dashboard → Analytics

### Important Notes
- **Serverless Functions**: Each route handler runs in an isolated serverless function
- **Cold Starts**: First request may be slower due to function initialization
- **Job Persistence**: AI analysis jobs are stored in memory and lost on cold starts (acceptable for Hobby plan)
- **Connection Pooling**: `@vercel/postgres` automatically manages database connections for serverless

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

### Async AI Analysis Pattern
- **Problem**: AI analysis can take >10 seconds, exceeding Vercel Hobby plan timeout
- **Solution**: Background job pattern with client-side polling
  1. Client calls analyze action → receives jobId
  2. Background job processes AI analysis (no timeout limit)
  3. Client polls `/api/analyze/status/[jobId]` every 2.5 seconds
  4. Job status updates: pending → processing → completed/failed
  5. Client displays result when completed
- **Limitations**: Jobs stored in memory, lost on cold starts (acceptable tradeoff for Hobby plan)
- **For Production**: Consider upgrading to Pro plan with Vercel KV for persistent job storage

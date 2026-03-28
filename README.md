# CourtLedger

CourtLedger is a one-page, full-stack NBA betting dashboard built with React, TypeScript, Tailwind CSS, Supabase, Recharts, and XLSX export support.

## Features

- Supabase auth: sign up, log in, log out, persistent session.
- User-scoped bets data with CRUD against your existing `bets` table.
- Manual live tracking with architecture ready for a future API provider.
- Active and settled bet sections with quick grading and duplicate actions.
- Profitability calculations: net P/L, total staked, ROI, win rate, average stake/odds.
- Analytics charts (profit over time, by market type, by sportsbook).
- CSV and XLSX exports for all or filtered datasets.
- Stream URL panel with embed fallback.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (`@supabase/supabase-js`)
- Recharts
- SheetJS (`xlsx`)
- react-hot-toast

## Local Setup

1. Install dependencies:
   - `npm install`
2. Create environment file:
   - Copy `.env.example` to `.env.local`
3. Fill in Supabase variables in `.env.local`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Start development server:
   - `npm run dev`

## Supabase Table Expectations

The app is wired to these existing tables:

- `profiles`
- `bets`
- `live_stats_cache`

It expects RLS policies to allow each authenticated user to access only their own rows (`user_id`-scoped).

## Manual Live Tracking and Future API Integration

The MVP works with manual live updates from the dashboard. Future provider integration is designed around:

- `src/lib/liveDataProvider.ts`

Replace `ManualLiveDataProvider` with an API-backed implementation later.

## Export Support

- CSV export: all or filtered bets.
- XLSX export: all or filtered bets.
- Export columns include key bet details and computed net profit/loss.

## Deployment to Vercel

1. Push repository to Git provider.
2. Import project in Vercel.
3. Set build settings (Vite defaults are usually auto-detected):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy.

### Post-deploy checklist

- Confirm login/signup flow works.
- Confirm bets CRUD works under RLS.
- Confirm charts render with real data.
- Confirm CSV and XLSX downloads.

## Scripts

- `npm run dev` - run local dev server
- `npm run build` - production build
- `npm run preview` - preview production build locally
- `npm run lint` - run lint checks

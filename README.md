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
- Bet Intelligence **Add to tracker** from Top Picks or a single analysis run (creates a pending bet with auto-settle enabled).
- Optional **auto-settle** for supported NBA player props via Supabase Edge Function + [balldontlie](https://www.balldontlie.io) (points, rebounds, assists, threes, PRA, steals, blocks, turnovers).

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

### Supabase CLI (Windows / no global install)

Typing `supabase` in PowerShell fails unless the CLI is installed globally. This repo lists **`supabase` in `devDependencies`**, so from the **project root** use **`npx`**:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase secrets set THE_ODDS_API_KEY=your_key BALLDONTLIE_API_KEY=your_key
npx supabase functions deploy nba-odds-slate
```

Or: `npm run sb:login`, `npm run sb:link -- --project-ref YOUR_PROJECT_REF`, `npm run sb:deploy:odds`.

## Supabase Table Expectations

The app is wired to these existing tables:

- `profiles`
- `bets`
- `live_stats_cache`

It expects RLS policies to allow each authenticated user to access only their own rows (`user_id`-scoped).

### Bet Intelligence (`bet_intelligence_reports`)

Run the migration in Supabase: open **SQL** → **New query**, paste the full file, **Run** (or use `supabase db push` if the repo is linked):

- `supabase/migrations/20260330120000_bet_intelligence_reports.sql`

Policies are idempotent (dropped before recreate). Command Center includes an **Open Intelligence** shortcut to `/intelligence`.

This creates the table, RLS, indexes, and `updated_at` trigger. The app route is **`/intelligence`** (sidebar: **Bet Intelligence**).

**Code map:** types `src/types/betIntelligence.ts`; engine `src/lib/betIntelligenceEngine.ts` plus `projectionEngine`, `lineMovement`, `edgeScoring`, `simulationEngine`, `riskAssessment`; Supabase `src/lib/betIntelligenceService.ts`; hook `src/hooks/useIntelligenceReports.ts`; UI `src/components/intelligence/*` and page `src/pages/BetIntelligencePage.tsx`. Future feeds: `src/lib/intelligenceDataProvider.ts`. Sample slate rows: `src/data/sampleBetIntelligence.ts`.

### Auto-settle columns on `bets`

Run the migration in the Supabase SQL editor (or via CLI):

- `supabase/migrations/20260330140000_bets_auto_settle.sql`

Adds `auto_settle_enabled`, `stats_player_id`, `stats_game_id`, `last_auto_settle_at`, and `auto_settle_error`. The app uses **column pruning** on insert/update, so older schemas still load until you migrate.

**UI:** Command Center bet form includes **Auto-settle** and optional **Stats API player/game id** fields (advanced). Active bets show an **Auto-settle on** label and any settle error hint.

### Edge Function `sync-bet-settlements`

Deploy with the [Supabase CLI](https://supabase.com/docs/guides/functions):

```bash
supabase functions deploy sync-bet-settlements --no-verify-jwt
```

Set secrets in the Supabase project (**Edge Functions → Secrets** or CLI):

- `BALLDONTLIE_API_KEY` — from your balldontlie account; sent as the `Authorization` header.
- `CRON_SECRET` — optional; when set, every invocation must include header `x-cron-secret: <same value>`.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually injected for Edge Functions automatically.

**Invoke manually (POST):**

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/sync-bet-settlements" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

**Schedule:** Use Supabase **pg_net** + **pg_cron**, GitHub Actions, or another cron to POST every 15–30 minutes during game windows. Respect balldontlie rate limits on your plan.

**Behavior notes:** Matching uses `game_date` and `team` / `opponent` (abbreviations like `BOS` / `LAL` work best). Wrong or ambiguous matches produce `auto_settle_error` until you fix team text or set **Stats API player id** / **game id** on the bet. Moneyline, spread, and game totals are **not** auto-graded. Settlement rules are simple numeric O/U (not book-specific void/half rules).

**Shared logic:** `src/utils/propSettlement.ts` mirrors the Edge Function grading rules; keep them aligned if you change one.

### Edge Function `nba-odds-slate` (Bet Intelligence → Load top 5 from odds)

Fills the **Top Picks** slate with up to **5** NBA player props (points, rebounds, assists) ranked by **devigged implied probability** on the favorite side of each line (median prices across US books returned by The Odds API). This is **not** a win guarantee—only “what the board prices imply.”

**Deploy** (keep JWT verification enabled so only signed-in users can call it):

```bash
supabase functions deploy nba-odds-slate
```

**Secrets** (Dashboard → Edge Functions → Secrets, or CLI):

- `THE_ODDS_API_KEY` — [The Odds API](https://the-odds-api.com/) key (query parameter on their requests).
- `BALLDONTLIE_API_KEY` — [balldontlie](https://www.balldontlie.io/) key (`Authorization` header).

Do **not** put these keys in the Vite app or commit them. If a key is ever pasted into chat or checked into git, **rotate it** at the provider.

**Cost discipline:** One button click uses **one** Odds API request (`player_points`, `player_rebounds`, `player_assists`, `regions=us`) plus a small number of balldontlie calls (teams + player search per candidate). The UI enforces a **90 second** cooldown between loads.

**Client:** `src/lib/nbaOddsSlateService.ts` invokes the function; **Bet Intelligence** → **Load top 5 from odds**.

**Troubleshooting — toast says it could not reach Edge Functions / “Failed to send a request”:** That is a **browser network** failure (no HTTP response from Supabase). Check `VITE_SUPABASE_URL` in `.env` is exactly `https://<project-ref>.supabase.co`, reload the dev server after edits, try another network or disable ad blockers, and confirm the function is deployed. If you see **HTTP 404** instead, deploy `nba-odds-slate`. If **HTTP 401**, sign out and back in.

**“Edge Function returned a non-2xx status code”:** The request reached Supabase; the function responded with an error. After updating the app, the toast should show **HTTP code + a short reason**. Typical fixes: **404** — `VITE_SUPABASE_URL` points at a **different** project than where `nba-odds-slate` was deployed; align the URL ref with **Dashboard → Edge Functions** (same project). **401** — sign in again; same Supabase project in `.env` as where you deployed. **500** — set secrets `THE_ODDS_API_KEY` and `BALLDONTLIE_API_KEY` (Dashboard → Edge Functions → Secrets). **502** — Odds API key or quota issue. Check **Edge Functions → nba-odds-slate → Logs** for the full stack trace.

**Production-only 401 Invalid JWT (Vercel checklist):**

1. In Vercel project settings, verify **Environment Variables** for the **Production** environment:
   - `VITE_SUPABASE_URL` must be `https://xswtikkyszzqtgdytlkk.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` must be from the same Supabase project (`ref: xswtikkyszzqtgdytlkk` in JWT payload)
2. Ensure the same values are not accidentally different in Preview vs Production for the currently served domain.
3. Trigger a fresh Production redeploy after env edits (Vercel does not retroactively update old builds).
4. In browser DevTools on the production domain, clear site data (or remove `localStorage` keys starting with `sb-`), then sign in again.
5. Confirm `nba-odds-slate` is deployed in project `xswtikkyszzqtgdytlkk` in Supabase Dashboard.

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
6. If auth worked before but now fails with `Invalid JWT`, re-check variable values in the **Production** scope specifically and redeploy.

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

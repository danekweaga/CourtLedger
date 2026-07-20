# CourtLedger — Project Explained (Interview Prep)

**One-line summary:** CourtLedger is a personal NBA bet tracker and analytics SPA where users log bets in Supabase, analyze ROI client-side, export ledgers, watch official NBA highlights via a Vercel proxy, and optionally auto-grade player props with a Supabase Edge Function.

**Live:** [https://court-ledger.vercel.app](https://court-ledger.vercel.app)

---

## Architecture (how the pieces fit together)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React SPA)                              │
│  main.tsx → App.tsx → AuthGate → AppFrame → Pages/Components            │
│                                                                          │
│  useCourtLedgerData (central hook)                                       │
│       │                                                                  │
│       ├── betsService / liveStatsService ──► Supabase JS (anon key + JWT)│
│       │         │                              Auth + Postgres (RLS)     │
│       │         └── tables: bets, live_stats_cache                       │
│       │                                                                  │
│       └── youtubeHighlightsService ──► fetch("/api/youtube-highlights")  │
│                                                                          │
│  localStorage: settings prefs, money-saved counter                       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    HTTPS (same origin on Vercel)
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                         VERCEL                                           │
│  Static: dist/ (Vite build)                                              │
│  vercel.json: /api/* → serverless    /* → index.html (SPA routing)       │
│                                                                          │
│  api/youtube-highlights.ts ──► YouTube Data API (YOUTUBE_DATA_API_KEY)   │
│  api/keepalive.ts ──► supabaseAdmin ──► SELECT id FROM bets LIMIT 1      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                         SUPABASE                                         │
│  Auth: email/password, JWT sessions                                      │
│  Postgres: bets (+ optional profiles, live_stats_cache)                 │
│  RLS: rows scoped by user_id / auth.uid()                              │
│                                                                          │
│  Edge Function: sync-bet-settlements                                     │
│       └── service role + BALLDONTLIE_API_KEY ──► grade auto_settle bets  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  GitHub Actions (.github/workflows/keepalive.yml)                        │
│  Weekly cron ──► GET /api/keepalive (wake Vercel + Supabase free tier)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data flow (the three paths interviewers care about)

**1. Bet CRUD (most of the app)**

```
BetForm submit → useCourtLedgerData.saveBet → betsService.createBet/updateBet
  → supabase.from('bets').insert/update (JWT attached automatically)
  → RLS checks user owns row → response → setBets in React state
  → filteredBets / summary recomputed via useMemo
```

**2. Highlights (secrets stay server-side)**

```
LiveCenterPage → fetchNbaHighlights() → GET /api/youtube-highlights
  → Vercel reads YOUTUBE_DATA_API_KEY → YouTube search API
  → JSON video list → iframe embeds on client
```

**3. Auto-settle (batch, not real-time UI)**

```
Cron/manual invoke → sync-bet-settlements Edge Function
  → SELECT pending bets WHERE auto_settle_enabled
  → balldontlie: resolve game + player + box score
  → propSettlement logic → UPDATE bets result_status
```

**Interview Q:** *Walk me through what happens when a user saves a bet.*

**Answer:** The form calls `saveBet` in `useCourtLedgerData`, which either `createBet` or `updateBet` in `betsService`. That merges the draft, computes payout/profit fields, and writes to the `bets` table through the Supabase client. The client sends the user's JWT; Postgres RLS ensures they can only insert/update their own `user_id`. On success I optimistically update local React state and show a toast—no full page reload.

---

## Technologies used (what to say if they ask “why X?”)

| Technology | Role in CourtLedger | Why it's here |
|------------|---------------------|---------------|
| **React 19** | UI | Component model, hooks for state; industry standard for SPAs. |
| **TypeScript** | Whole frontend | Catches shape errors on `Bet`, API responses, props. |
| **Vite** | Dev server + bundler | Fast HMR; simpler than CRA; builds to static `dist/`. |
| **React Router 7** | Client routing | `/history`, `/live`, etc. without a Node server for HTML. |
| **Tailwind CSS 4** | Styling | Utility classes; design tokens in `tailwind.config.ts`. |
| **Supabase** | Auth + Postgres + Edge Functions | Managed backend; anon key + RLS is enough for user CRUD without writing a custom API for bets. |
| **@supabase/supabase-js** | Browser + server clients | Same SDK for client (anon) and admin (service role in keepalive/edge). |
| **Vercel** | Hosting + serverless | SPA + `api/*.ts` in one repo; auto-deploy on push. |
| **Recharts** | Analytics charts | Profit-over-time and breakdown visuals on `AnalyticsPage`. |
| **react-hot-toast** | Notifications | Save/delete/auth errors without custom modal plumbing. |
| **Tesseract.js** | OCR in browser | Bet slip photo → text → `parseBetSlipText` fills draft fields. |
| **xlsx (SheetJS)** | Excel export | Client-side workbook generation; no server needed. |
| **clsx** | Class names | Conditional Tailwind strings (minor). |
| **lucide-react** | Icons | Some icon usage alongside Material Symbols. |
| **balldontlie API** | NBA stats (edge only) | Free-tier stats for auto-settlement; not called from browser. |
| **YouTube Data API** | Highlights | Official NBA channel search; key hidden behind Vercel route. |
| **GitHub Actions** | Scheduled keepalive | Pings production so free-tier services don't pause. |
| **ESLint + tsc** | Quality gate | `npm run lint` and `tsc -b` before production build. |

**Interview Q:** *Why Supabase instead of building your own Express API?*

**Answer:** For a personal bet ledger, most operations are CRUD scoped to one user. Supabase gives me auth, Postgres, and RLS out of the box, so the browser can talk to the database safely with the anon key. I only added Vercel serverless routes where I need secrets (YouTube key) or the service role (keepalive). Auto-settle is a batch job, so that lives in a Supabase Edge Function with the service role—not in the client.

---

## Entry point and routing

### `src/main.tsx`

Mounts React in strict mode, wraps `App` in `BrowserRouter`. That's the entire bootstrap—no Redux, no global data provider. Session and bets live in hooks lower in the tree.

### `src/App.tsx` (function by function)

| Piece | What it does | Why |
|-------|--------------|-----|
| `App()` | Renders `AuthGate` + `ToastProvider` | Auth wraps everything; toasts are global. |
| `CourtLedgerApp({ session })` | Authenticated shell | Only runs when `AuthGate` has a session. |
| `useCourtLedgerData(session.user.id)` | Loads and mutates all bet state | Single hook = one place for CRUD, filters, summary. |
| `frameConfig` (`useMemo`) | Maps `location.pathname` → title, subtitle, active nav key | Keeps `AppFrame` in sync with React Router without duplicating nav logic in every page. |
| `handleAddBetClick` | Navigates to `/` and scrolls to bet form | Mobile "Add" and sidebar CTA share one behavior. |
| `useEffect` + `?focus=bet-form` | Deep-link scroll to form | Supports navigation from other pages to the form. |
| `handleSignOut` | `signOut()` + toast | Cleans Supabase session. |
| `<Routes>` | Declares 6 pages | Command Center gets the fat prop list; analytics/markets only need `bets`. |

**Interview Q:** *Where is global state?*

**Answer:** There's no Redux or Zustand. Authenticated state is `useCourtLedgerData` instantiated once in `CourtLedgerApp` and passed down as props. Auth session comes from `AuthGate`. Settings like default stake use `localStorage` in `SettingsPage` and `moneySavedStorage.ts`. It's intentional—small app, predictable data flow.

---

## Authentication layer

### `src/lib/supabase.ts`

- Creates the singleton Supabase client with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- **Project ref validation:** decodes JWT payload of anon key and compares subdomain of URL—throws if you mixed keys from two projects (a common copy-paste mistake).
- Auth options: `persistSession`, `autoRefreshToken`, `detectSessionInUrl`.

**Interview Q:** *Is the anon key secret?*

**Answer:** It's public in the browser bundle—that's how Supabase works. Security is RLS: the anon key alone can't read other users' bets. The **service role** key never ships to the client; it's only on Vercel keepalive and the edge function.

### `src/lib/auth.ts`

Thin wrappers: `signUp`, `signInWithPassword`, `signOut`, `getSession`, `onAuthStateChange`. No custom token logic.

### `src/components/auth/AuthGate.tsx`

1. On mount: `getSession()` + subscribe to `onAuthStateChange`.
2. **Token refresh guard:** on `SIGNED_OUT`, re-fetch session before clearing UI—avoids flicker during refresh races.
3. No session → `PublicHome` or `AuthForm`.
4. Session → `children(session)` render prop pattern.

**Interview Q:** *How do you protect routes?*

**Answer:** There's no per-route guard component. The whole app tree is behind `AuthGate`—if you're not logged in, you never mount `CourtLedgerApp` or the routes. API routes `/api/youtube-highlights` and `/api/keepalive` are intentionally public (read-only highlights; keepalive returns no user data).

---

## Core data layer

### `src/types/bets.ts`

Defines the domain model: `Bet`, `BetDraft`, enums for market types, result status, live status. `BetDraft` omits `id`, `user_id`, timestamps—what the form edits.

Auto-settle fields: `auto_settle_enabled`, `stats_player_id`, `stats_game_id`, `last_auto_settle_at`, `auto_settle_error`.

### `src/hooks/useCourtLedgerData.ts` (the spine)

| Function / state | Purpose |
|----------------|---------|
| `bets`, `loadBets` | Source of truth from Supabase |
| `filters`, `sort`, `filteredBets` | Client-side filter/sort (no server queries per filter) |
| `activeBets` / `settledBets` | Split on `result_status === "pending"` |
| `summary` | `computeSummaryStats(bets)` — ROI, win rate, etc. |
| `saveBet` | Create or update; computes `target_remaining` |
| `startEdit` | Copies `Bet` → `BetDraft` for the form |
| `removeBet`, `cloneBet`, `gradeBet` | Delete, duplicate, quick W/L/P |
| `updateLiveStat` | Manual live stat entry + `live_stats_cache` upsert |
| `loadSampleData` | Inserts `mockBets` for demos |
| `moneySavedFromBetting` | `localStorage`, not Supabase |

Errors → `react-hot-toast`; loading flags per operation.

**Interview Q:** *Why load all bets instead of paginating?*

**Answer:** Personal ledger scale—users might have hundreds of bets, not millions. Filtering and analytics run in memory with `useMemo`, which keeps the UI snappy and avoids complex Supabase query builders. Trade-off: doesn't scale to huge datasets; fine for this product.

### `src/lib/betsService.ts`

| Function | Behavior |
|----------|----------|
| `fetchBets(userId)` | `select *` where `user_id`, order by `date_placed` desc |
| `createBet` / `updateBet` | `withComputedFields` then insert/update |
| `insertBetWithColumnPruning` / `updateBetWithColumnPruning` | **Schema tolerance:** if Postgres returns "column not found", strip that key and retry (up to 12 times) |
| `duplicateBet` | Resets to pending, new date, clears game resolution fields |
| `quickGradeBet` | `gradeBetByManualResult` → update row |
| `normalizeBetRow` | Fills null auto-settle booleans |

**Interview Q:** *What's column pruning?*

**Answer:** The app evolved ahead of some deployed schemas. Instead of hard-failing when a column isn't migrated yet, I parse Supabase's error, remove the unknown field, and retry. It's a pragmatic compatibility layer—not ideal long-term; migrations should be the source of truth.

### `src/lib/liveStatsService.ts`

- `updateBetLiveTracking`: updates `current_stat_value`, `target_remaining`, live flags on `bets`.
- `upsertLiveStat`: writes `live_stats_cache` with conflict on `(bet_id, user_id)`.

Live tracking is **manual** in the UI today—not a live NBA feed.

---

## Business logic (utils)

### `src/utils/profit.ts`

- `computePotentialPayout`: American odds → decimal via `odds.ts`, multiply by stake.
- `computeProfitForResult`: win = payout − stake; loss = −stake; push/void = 0; cash_out uses `cash_out_amount`.
- `computeRoi`: `totalProfit / totalStaked * 100`.

### `src/utils/grading.ts`

`gradeBetByManualResult`: sets `result_status`, appends net profit to `notes`.

`getHitStateLabel`: UI copy for pending bets based on `target_remaining`.

### `src/utils/propSettlement.ts`

Shared rules with the Edge Function:

- `isAutoSettleMarketType` — points, rebounds, assists, etc. (not double-double, moneyline, spread).
- `finalStatFromBoxRow` — maps box score fields to market.
- `settlePlayerPropFromFinalStat` — over/under vs line with epsilon for push.

**Interview Q:** *How do you keep client and server grading consistent?*

**Answer:** The edge function comment explicitly says to keep it aligned with `propSettlement.ts` and `grading.ts`. In practice it's duplicated logic in Deno vs browser—a trade-off. A shared npm package or one grading API would be cleaner at scale.

### `src/utils/analytics.ts`

Pure functions over `Bet[]`: `computeSummaryStats`, `profitOverTime`, breakdowns by market/book/player. Used by Command Center summary, Analytics, Market Intelligence—all **client-side aggregation**.

### `src/utils/betFiltering.ts`

`applyFiltersAndSort`: date range, player, team, sportsbook, market, result, search string; sort by newest, stake, profit, "closest to hitting."

### `src/utils/progress.ts`

`calculateTargetRemaining` / `calculateProgressPercentage` for live prop tracking UI.

### Export: `exportCsv.ts`, `exportXlsx.ts`, `exportColumns.ts`

Build tabular export from in-memory bets—no server round trip.

### OCR: `betSlipOcr.ts`, `parseBetSlipText.ts`, `BetSlipScanner.tsx`

1. User uploads image.
2. `resizeImageFile` downscales for performance.
3. Tesseract worker extracts text (with timeout).
4. Regex heuristics fill `BetDraft` fields.

**Limitation:** OCR is best-effort; sportsbook layouts vary wildly.

---

## Pages (route-level)

| Route | File | Responsibility |
|-------|------|----------------|
| `/` | `CommandCenterPage.tsx` | Dashboard: summary cards, `BetForm`, filters, active/settled lists, export, `StreamPanel` |
| `/history` | `BetHistoryPage.tsx` | Full ledger with actions |
| `/live` | `LiveCenterPage.tsx` | Highlight Hub only |
| `/markets` | `MarketIntelligencePage.tsx` | Profit by market type heatmap |
| `/analytics` | `AnalyticsPage.tsx` | Recharts, time ranges |
| `/settings` | `SettingsPage.tsx` | Email/user id display; prefs in localStorage |

### `LiveCenterPage.tsx`

- `loadHighlights` → `fetchNbaHighlights`.
- States: loading, error (with retry), empty, grid of `HighlightCard` iframes.
- No auth-specific data—same highlights for every logged-in user.

### `MarketIntelligencePage.tsx`

Note: timeframe `<select>` is **UI only**—it doesn't filter bets yet. Profit bars use real `profitByMarketType(bets)` data.

**Interview Q:** *Be honest about something incomplete.*

**Answer:** Market Intelligence timeframe dropdown doesn't wire to filters yet—it's visual. Analytics page has real range filtering; markets page is aggregated on the full bet list passed from the parent.

---

## Layout and components (selected)

### `src/components/layout/AppFrame.tsx`

- Desktop sidebar: logo (`CourtLedgerLogo`), nav links, "Place New Bet", sign out.
- Fixed header: page title from `AppFrame` props, mobile icon logo.
- Bottom mobile nav: quick links + add button.
- `activeNav` highlights current section.

### `src/components/bets/BetForm.tsx`

Controlled form from `draft` prop. `setValue` recalculates payout when stake/odds change. Auto-settle checkbox with honest copy about edge job + balldontlie.

### `src/components/stream/StreamPanel.tsx`

Embeds optional `stream_url` per bet (user-provided link)—not tied to NBA API.

### `src/components/branding/CourtLedgerLogo.tsx`

Renders `court-ledger-logo.png` or icon-only `favicon.png` from `public/`.

### `src/components/layout/DashboardShell.tsx`

Legacy/alternate shell—**not used** by current `App.tsx` (uses `AppFrame`). Safe to mention if asked about dead code.

---

## Serverless API routes (Vercel)

### `api/youtube-highlights.ts`

- `GET` only; `readApiKey()` or 503 with hint to set Vercel env.
- Searches official NBA channel (`UCWJ2lWNubArHWmf3FIHbfcQ`), query `"highlights"`, max 12.
- Normalizes to `{ videoId, title, publishedAt, ... }`.
- 502 on upstream YouTube errors; logs truncated body server-side.

**Interview Q:** *Why proxy YouTube instead of calling from the browser?*

**Answer:** API keys in the client are extractable from the bundle. The proxy keeps `YOUTUBE_DATA_API_KEY` on the server and gives me one place to handle errors and shape the response.

### `api/keepalive.ts`

- Service role client → `select id from bets limit 1`.
- No auth on endpoint—by design for cron; returns no row contents, just `{ ok: true }`.
- **Risk:** public endpoint could be abused for light DoS; acceptable for a personal project.

### `lib/supabaseAdmin.ts`

Singleton service-role client; `persistSession: false`. Used only server-side.

---

## Supabase backend

### Tables (expected)

| Table | Used for |
|-------|----------|
| `bets` | Main ledger |
| `live_stats_cache` | Optional cache on manual live updates |
| `profiles` | Documented in README; not heavily used in UI |
| `bet_intelligence_reports` | Legacy migration; feature removed from app |

### `supabase/migrations/20260330140000_bets_auto_settle.sql`

Adds auto-settle columns to `bets`.

### `supabase/functions/sync-bet-settlements/index.ts`

- Deno edge function with service role.
- Fetches pending + `auto_settle_enabled` bets.
- balldontlie: games by date, player search/scoring, stats by game.
- Rate limiting: `sleep(85)` between BDL calls.
- Optional `CRON_SECRET` header check.
- Updates bet `result_status` or `auto_settle_error`.
- **Does not** grade moneyline, spread, totals, double-double markets.

Deployed with `--no-verify-jwt` (invoked by cron with secret, not end users).

**Interview Q:** *Is auto-settle real-time?*

**Answer:** No. It's a batch job you invoke on a schedule during game windows. The UI checkbox marks which bets are eligible; the edge function does the work when it runs.

---

## Infrastructure and CI/CD

### `vercel.json`

- Build: `npm run build` → `dist/`.
- Rewrites: `/api/*` to serverless; everything else to `index.html` for SPA routing.

### `.github/workflows/keepalive.yml`

- Cron: Monday 09:00 UTC (`0 9 * * 1`).
- `curl` production `/api/keepalive`.
- **Note:** URL placeholder `YOUR-APP-NAME` must be replaced with `court-ledger` (or your deployment hostname).

### Deploy flow

```
git push main → Vercel build (tsc + vite) → deploy dist + api/
Env vars must be set in Vercel dashboard; changing secrets requires redeploy.
```

**Interview Q:** *What's your CI/CD story?*

**Answer:** Vercel auto-deploys on push to main. I run `lint` and `build` locally before merging. GitHub Actions only runs the weekly keepalive ping—not full test suite. There's no automated E2E in the repo today.

---

## Storage model summary

| Data | Where | Scoped by |
|------|-------|-----------|
| Bets | Supabase `bets` | `user_id` + RLS |
| Live stat cache | Supabase `live_stats_cache` | `user_id` |
| Session | Supabase Auth (JWT in browser) | user |
| Default stake, NBA-only toggle | `localStorage` | browser only |
| Money saved counter | `localStorage` (`moneySavedStorage.ts`) | browser only |
| Highlights | YouTube (fetched per page load) | global |
| Logo/favicon | `public/` static assets | global |

**Interview Q:** *What happens if the user clears localStorage?*

**Answer:** Settings prefs and money-saved counter reset. Bets are safe in Supabase—they're tied to auth, not local storage.

---

## Error handling patterns

1. **Service layer:** `throw` Supabase errors upward.
2. **Hook layer:** `try/catch` → `toast.error(message)`.
3. **AuthGate:** toast on session load failure; signed-out guard on refresh.
4. **Highlight Hub:** dedicated loading/error/empty UI with retry button.
5. **API routes:** structured JSON `{ ok, error, hint?, timestamp }`; HTTP status codes 405/502/503/500.
6. **Column pruning:** recover from schema mismatch instead of crashing insert.

No global error boundary component in the repo—errors are localized.

---

## Trade-offs and limitations (say these honestly)

1. **No pagination** — all bets loaded for a user; fine for personal use, not for a sportsbook scale.
2. **Client-side analytics** — recomputes on every bet change; simple but O(n) per view.
3. **Manual live stats** — no automatic NBA play-by-play feed in the UI.
4. **OCR is heuristic** — Tesseract + regex, not ML structured extraction.
5. **Auto-settle duplication** — grading logic in TS utils and Deno edge function.
6. **Auto-settle scope** — player props only; name matching can fail on ambiguous players.
7. **Public keepalive + highlights API** — no rate limiting in app code.
8. **Market Intelligence timeframe** — dropdown not wired to data.
9. **Bet Intelligence removed** — was a larger feature (odds APIs, engine); stripped to reduce scope; DB migration may remain.
10. **No automated tests** in repo — manual verification via lint/build and prod smoke checks.
11. **Single hook god-object** — `useCourtLedgerData` is large; works now, would split if the app grew.

---

## File index (quick reference)

| Path | Role |
|------|------|
| `src/main.tsx` | React bootstrap + router |
| `src/App.tsx` | Routes, session, hook wiring |
| `src/hooks/useCourtLedgerData.ts` | Central bet state + actions |
| `src/lib/betsService.ts` | Supabase CRUD |
| `src/lib/auth.ts` | Auth wrappers |
| `src/lib/supabase.ts` | Browser Supabase client |
| `src/lib/youtubeHighlightsService.ts` | Highlights fetch client |
| `src/lib/liveStatsService.ts` | Live stat updates |
| `src/lib/betSlipOcr.ts` | Tesseract OCR |
| `src/types/bets.ts` | Domain types |
| `src/utils/*.ts` | Pure business logic |
| `src/pages/*.tsx` | Route pages |
| `src/components/**` | UI pieces |
| `api/*.ts` | Vercel serverless |
| `lib/supabaseAdmin.ts` | Service role client |
| `supabase/functions/sync-bet-settlements` | Auto-grade job |
| `supabase/migrations/*.sql` | Schema |
| `.github/workflows/keepalive.yml` | Weekly ping |
| `vercel.json` | Deploy config |
| `tailwind.config.ts` | Theme tokens |

---

## Likely interview questions (quick answers)

**What is CourtLedger?**  
A personal NBA bet tracking dashboard—not a sportsbook. Log bets, track P/L and ROI, export data, watch official highlights, optionally auto-settle props.

**What did you build vs what did libraries do?**  
I built the UX, data model, filtering, analytics, export, OCR pipeline, Vercel proxies, and auto-settle orchestration. Supabase handles auth/DB/RLS; Vercel hosts; Recharts charts; Tesseract OCR; balldontlie/YouTube are external data.

**Hardest technical problem?**  
Keeping secrets off the client (YouTube proxy) and making bet writes tolerant of schema drift (column pruning) while RLS still enforces per-user data.

**How is auth secured?**  
Supabase JWT + RLS on `bets`. Anon key is public by design; service role only on server/edge.

**Why Vite and not Next.js?**  
Mostly client-rendered dashboard with a few API routes. Vite + React Router is simpler—no SSR complexity for an authenticated SPA.

**How would you scale it?**  
Server-side pagination and filtered queries, move analytics to SQL/materialized views, shared grading package, rate limiting on public APIs, E2E tests, split the mega-hook.

**What would you do differently?**  
Add tests earlier, one source of truth for settlement math, wire Market Intelligence filters, remove dead code (`DashboardShell`), delete unused `bet_intelligence_reports` migration if DB allows.

**Tell me about a bug you hit in production.**  
Highlight Hub returned 503 until `YOUTUBE_DATA_API_KEY` was set on Vercel Production and redeployed—client can't fix missing server env.

**What is RLS?**  
Postgres row-level security policies so `auth.uid()` matches `user_id` on queries—even with the anon key, users can't SELECT other accounts' bets.

**Difference between anon key and service role?**  
Anon respects RLS as the logged-in user. Service role bypasses RLS—only for trusted server jobs like keepalive and auto-settle.

**Is this real-time?**  
No WebSockets. Bets refresh on load and after mutations. Highlights refresh on page load or button click. Auto-settle is cron/batch.

**What data structures/algorithms did you use?**  
Maps for analytics breakdowns (`toBreakdownMap`), filter/sort on arrays, cumulative sum for profit-over-time, name-scoring heuristic in edge function for player matching.

**Why TypeScript?**  
`Bet` has 30+ fields; types catch prop drift between form, service, and Supabase responses.

**Deployment?**  
GitHub → Vercel auto-build. Env vars in Vercel. Supabase hosted separately. Edge function deployed via Supabase CLI.

**What’s in localStorage vs Supabase?**  
Bets and auth session (Supabase). UI preferences and “money saved” counter in localStorage only.

**Did you use AI to build it?**  
Cursor assisted with boilerplate and refactors; I own architecture, security boundaries, env config, and what ships to production.

---

*Based on CourtLedger `main` as of May 2026. If the code changes, update the file paths and feature list to match.*

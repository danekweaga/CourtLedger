# CourtLedger

CourtLedger is a full-stack **NBA betting tracker and analytics dashboard**. It helps you log props and game bets, track active positions, grade outcomes, visualize ROI, export your ledger, and watch official NBA highlights.

**Live app:** [https://court-ledger.vercel.app](https://court-ledger.vercel.app)

---

## Table of contents

1. [What this project is](#what-this-project-is)
2. [Architecture overview](#architecture-overview)
3. [App routes and features](#app-routes-and-features)
4. [Tech stack](#tech-stack)
5. [Repository layout](#repository-layout)
6. [Local development](#local-development)
7. [Environment variables](#environment-variables)
8. [Supabase setup](#supabase-setup)
9. [Vercel deployment](#vercel-deployment)
10. [Serverless API routes](#serverless-api-routes)
11. [Supabase Edge Functions](#supabase-edge-functions)
12. [Keep-alive system](#keep-alive-system)
13. [Highlight Hub](#highlight-hub)
14. [Scripts](#scripts)
15. [Security notes](#security-notes)

---

## What this project is

CourtLedger is **not** a sportsbook. It is a personal command center for:

- Recording bets (player props, spreads, totals, etc.)
- Tracking pending vs settled results and P/L
- Filtering, sorting, duplicating, and quick-grading bets
- Analytics charts (profit over time, by market, by book)
- CSV / XLSX export
- Optional auto-settlement for supported NBA player props via balldontlie
- Embedded official NBA YouTube highlights (Highlight Hub)

Authentication is handled by **Supabase Auth**. All bet data is scoped per user with **Row Level Security (RLS)**.

---

## Architecture overview

```mermaid
flowchart TB
  subgraph browser [Browser - React SPA]
    Pages[Pages and Components]
    ClientSupabase[Supabase Client - anon key]
    Pages --> ClientSupabase
  end

  subgraph vercel [Vercel]
    Static[Static Vite build - dist]
    ApiKeepalive[/api/keepalive]
    ApiHighlights[/api/youtube-highlights]
  end

  subgraph supabase [Supabase]
    Auth[Auth]
    DB[(PostgreSQL)]
    EdgeSettle[sync-bet-settlements]
  end

  subgraph external [External APIs]
    YouTube[YouTube Data API]
    BDL[balldontlie]
  end

  Pages --> Static
  Pages --> ApiHighlights
  ClientSupabase --> Auth
  ClientSupabase --> DB
  ApiKeepalive --> DB
  ApiHighlights --> YouTube
  EdgeSettle --> BDL
  EdgeSettle --> DB
```

| Layer | Role |
|-------|------|
| **React + Vite** | Single-page app, client routing, UI |
| **Supabase client** | Auth, CRUD on `bets` |
| **Vercel serverless** | Server-only secrets (YouTube, keepalive cron auth) |
| **Supabase Edge Functions** | Auto-settlement cron target (service role + mandatory `CRON_SECRET`) |
| **GitHub Actions** | Optional weekly keepalive ping (requires repository secrets) |

---

## App routes and features

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Command Center | Add/edit bets, active & settled lists, filters, export, stream panel for individual bets |
| `/history` | Bet History | Full ledger with edit/grade/duplicate |
| `/live` | Highlight Hub | Embedded recent official NBA YouTube highlights |
| `/markets` | Market Intelligence | Market-level views from your bet data |
| `/analytics` | ROI Analytics | Charts and performance metrics |
| `/settings` | Settings | Account preferences |

**Core betting features**

- Supabase auth (sign up, log in, sign out, persistent session)
- User-scoped bet CRUD with column pruning for schema compatibility
- Active / settled sections, quick grade, duplicate
- Net P/L, ROI, win rate, average stake/odds
- Bet slip OCR helper (Tesseract.js)
- CSV and XLSX export
- Per-bet stream URL embed on Command Center (`StreamPanel`)
- Auto-settle for supported NBA player props (optional)

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, React Router, Tailwind CSS
- **Backend / data:** Supabase (Auth, Postgres, Edge Functions)
- **Hosting:** Vercel (static SPA + serverless API routes)
- **Charts:** Recharts
- **Export:** SheetJS (`xlsx`)
- **Toasts:** react-hot-toast
- **OCR:** tesseract.js

---

## Repository layout

```
CourtLedger/
├── api/                          # Vercel serverless functions
│   ├── keepalive.ts              # Weekly Supabase ping
│   └── youtube-highlights.ts     # YouTube Data API proxy
├── lib/
│   ├── cronAuth.ts               # Shared cron secret verification
│   └── supabaseServerAnon.ts     # Server-side anon client (keepalive only)
├── tests/
│   ├── cronAuth.test.ts          # Unit tests for cron auth
│   └── rls-isolation.test.ts     # RLS integration tests (requires Supabase env)
├── src/
│   ├── pages/                    # Route-level pages
│   ├── components/               # UI by domain (bets, auth, layout, …)
│   ├── hooks/                    # useCourtLedgerData
│   ├── lib/                      # Services (bets, auth, highlights, …)
│   ├── types/                    # TypeScript models
│   └── utils/                    # Grading, export, filtering, etc.
├── supabase/
│   ├── functions/                # Edge Functions
│   └── migrations/               # SQL migrations
├── .github/workflows/
│   └── keepalive.yml             # Weekly cron → /api/keepalive
├── vercel.json                   # SPA rewrites + /api/* passthrough
└── README.md
```

---

## Local development

### Prerequisites

- Node.js 18+
- A Supabase project
- (Optional) Supabase CLI via `npx supabase`
- (Optional) Vercel CLI for testing API routes locally

### Steps

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment file**

   Create `.env.local` (or `.env`) at the project root:

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open the URL Vite prints (usually `http://localhost:5173`).

4. **Test Vercel API routes locally**

   The Vite dev server does **not** serve `/api/*`. Use:

   ```bash
   npx vercel dev
   ```

   Then hit `http://localhost:3000/api/youtube-highlights`.

   Keepalive requires the `x-cron-secret` header:

   ```bash
   curl -H "x-cron-secret: YOUR_CRON_SECRET" http://localhost:3000/api/keepalive
   ```

### Supabase CLI (Windows-friendly)

The CLI is in `devDependencies`. From the project root:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase secrets set CRON_SECRET=your_long_random_secret
npx supabase secrets set BALLDONTLIE_API_KEY=your_key
npx supabase functions deploy sync-bet-settlements --no-verify-jwt
```

`--no-verify-jwt` is used only because schedulers invoke the function with a shared secret instead of a user JWT. The function **fails closed** unless `CRON_SECRET` is configured and sent in the `x-cron-secret` header. Never pass secrets in query strings.

Or use npm scripts: `npm run sb:login`, `npm run sb:link`, `npm run sb:deploy:settle`.

---

## Environment variables

### Client-side (Vite — exposed to the browser)

| Variable | Where used |
|----------|------------|
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts` |

These are baked into the build at deploy time. Changing them in Vercel requires a **redeploy**.

### Server-side (Vercel — never exposed to the browser)

| Variable | Where used |
|----------|------------|
| `SUPABASE_URL` | `lib/supabaseServerAnon.ts` (keepalive) |
| `SUPABASE_ANON_KEY` | `lib/supabaseServerAnon.ts` (keepalive) |
| `CRON_SECRET` | `api/keepalive.ts` (mandatory) |
| `YOUTUBE_DATA_API_KEY` | `api/youtube-highlights.ts` |
| `YOUTUBE_NBA_CHANNEL_ID` | Optional override for Highlight Hub channel |

**Do not** prefix server secrets with `VITE_`. Do not commit API keys to git.

### Supabase Edge Function secrets (Supabase Dashboard only)

| Variable | Where used |
|----------|------------|
| `CRON_SECRET` | `sync-bet-settlements` (mandatory) |
| `BALLDONTLIE_API_KEY` | `sync-bet-settlements` |
| `SUPABASE_SERVICE_ROLE_KEY` | `sync-bet-settlements` (auto-settle only; never on Vercel) |

---

## Supabase setup

### Expected tables

| Table | RLS | Scope |
|-------|-----|-------|
| `bets` | Enabled | `auth.uid() = user_id` |
| `profiles` | Enabled | `auth.uid() = id` |
| `live_stats_cache` | Enabled | `auth.uid() = user_id` |
| `bet_intelligence_reports` | Enabled | `auth.uid() = user_id` |
| `keepalive_ping` | Enabled | Read-only ping row; no user data |

### Migrations

Run in Supabase **SQL Editor** or via `supabase db push`:

| File | Purpose |
|------|---------|
| `supabase/migrations/20260330100000_initial_schema.sql` | Core tables + RLS policies |
| `supabase/migrations/20260330120000_bet_intelligence_reports.sql` | Intelligence reports table + RLS |
| `supabase/migrations/20260330140000_bets_auto_settle.sql` | Auto-settle columns on `bets` |

The app uses **column pruning** on insert/update, so older schemas still load until you migrate.

### Auto-settle columns on `bets`

Adds: `auto_settle_enabled`, `stats_player_id`, `stats_game_id`, `last_auto_settle_at`, `auto_settle_error`.

Command Center bet form includes **Auto-settle** and optional stats API IDs. Grading logic is shared with `src/utils/propSettlement.ts` and the Edge Function — keep them aligned if you change rules.

---

## Vercel deployment

1. Push the repo to GitHub (or GitLab/Bitbucket).
2. Import the project in [Vercel](https://vercel.com).
3. Build settings (usually auto-detected):
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Set environment variables (Production + Preview as needed):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `CRON_SECRET`
   - `YOUTUBE_DATA_API_KEY`
5. Deploy.

`vercel.json` rewrites all non-API paths to `index.html` for client-side routing, while `/api/*` hits serverless functions.

### Post-deploy checklist

- [ ] Sign up / log in works
- [ ] Create, edit, delete bets under RLS
- [ ] Charts render with real data
- [ ] CSV / XLSX export downloads
- [ ] Highlight Hub loads (after `YOUTUBE_DATA_API_KEY` is set)

---

## Serverless API routes

### `GET /api/keepalive`

- **File:** `api/keepalive.ts`
- **Purpose:** Lightweight anon-key ping against the `keepalive_ping` table (no user data)
- **Auth:** Mandatory `x-cron-secret` header matching `CRON_SECRET`; rejects secrets in query strings; fails closed if `CRON_SECRET` is missing
- **Env:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CRON_SECRET`

### `GET /api/youtube-highlights`

- **File:** `api/youtube-highlights.ts`
- **Purpose:** Fetch recent highlight videos from the official @NBA YouTube channel
- **Auth:** None for read; API key stays server-side
- **Env:** `YOUTUBE_DATA_API_KEY`, optional `YOUTUBE_NBA_CHANNEL_ID`

---

## Supabase Edge Functions

### `sync-bet-settlements`

Auto-grades pending bets with `auto_settle_enabled` using balldontlie box scores.

**Secrets:** `BALLDONTLIE_API_KEY`, `CRON_SECRET` (mandatory), `SUPABASE_SERVICE_ROLE_KEY`

**Auth:** `POST` only. Mandatory `x-cron-secret` header; rejects secrets in query strings; fails closed if `CRON_SECRET` is missing.

```bash
npx supabase secrets set CRON_SECRET=your_long_random_secret
npx supabase functions deploy sync-bet-settlements --no-verify-jwt
```

Invoke on a schedule during game windows with the same `x-cron-secret` header. Moneyline, spread, and game totals are **not** auto-graded.

---

## Keep-alive system

Inactive free-tier projects can pause. CourtLedger includes an optional weekly ping:

1. **GitHub Actions** — `.github/workflows/keepalive.yml`
   - Cron: Mondays 09:00 UTC
   - Manual trigger: `workflow_dispatch`
   - Requires repository secrets: `KEEPALIVE_URL` (e.g. `https://court-ledger.vercel.app`) and `CRON_SECRET`
   - Sends `x-cron-secret` in the request header (never in the URL)

2. **Vercel endpoint** — `/api/keepalive` runs a minimal anon-key query against `keepalive_ping`.

Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `CRON_SECRET` in Vercel for the keepalive function.

---

## Highlight Hub

**Route:** `/live` (sidebar: **Highlight Hub**)

Embeds recent highlight uploads from the official @NBA YouTube channel (`UCWJ2lWNubArHWmf3FIHbfcQ` by default).

- **Client:** `src/pages/LiveCenterPage.tsx`, `src/lib/youtubeHighlightsService.ts`
- **Server:** `api/youtube-highlights.ts`
- **Env:** `YOUTUBE_DATA_API_KEY` in Vercel (server-side only)

The YouTube API key must never be committed or exposed via `VITE_*` variables.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests + RLS tests (RLS tests skip without Supabase env) |
| `npm run test:rls` | RLS isolation integration tests only |
| `npm run sb:login` | Supabase CLI login |
| `npm run sb:link` | Link local repo to Supabase project |
| `npm run sb:deploy:settle` | Deploy `sync-bet-settlements` |

---

## Security notes

Verified controls in this repository:

- **RLS on user-owned tables** — `bets`, `profiles`, `live_stats_cache`, and `bet_intelligence_reports` are scoped with `auth.uid()` policies in version-controlled migrations.
- **Cron auth fails closed** — `CRON_SECRET` is mandatory for `/api/keepalive` and `sync-bet-settlements`. Missing, empty, or incorrect secrets return `503`/`401`. Secrets must be sent in the `x-cron-secret` header, never query strings.
- **No service role on Vercel** — keepalive uses the anon key against the non-sensitive `keepalive_ping` table.
- **Service role isolation** — the Supabase service role key is used only inside the `sync-bet-settlements` Edge Function.
- **Public highlight proxy** — `/api/youtube-highlights` keeps the YouTube API key server-side; it is intentionally unauthenticated read-only.
- **RLS tests** — `tests/rls-isolation.test.ts` verifies cross-user read/update/settle/delete isolation when Supabase test env vars are configured.

Operational requirements:

- **Never commit** `.env`, service role keys, or third-party API keys.
- **Rotate keys** immediately if they are pasted in chat, logged, or checked into git.
- **Anon key** is public in the browser bundle by design; security depends on RLS, not hiding the anon key.
- **Apply migrations** to every Supabase environment before relying on RLS coverage.

Not covered by automated tests in this repo:

- Rate limiting on public API routes
- WAF / bot protection at the CDN edge
- Production Supabase dashboard settings (email confirmation, leaked password protection, etc.)

---

## License

This repository is public source code. No license file is included, so default copyright applies unless the repository owner adds one.

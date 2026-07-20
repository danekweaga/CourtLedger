# CourtLedger Developer Learning Guide

A personal roadmap for building full-stack web apps with Cursor, centered on the CourtLedger project stack (React, TypeScript, Supabase, Vercel).

**Live app:** [https://court-ledger.vercel.app](https://court-ledger.vercel.app)

Use this document with an online Markdown converter when you need a PDF, Word doc, or printable version.

Sections marked **(project)** tie lessons to files and features in this repo. General CS and Cursor guidance appears throughout as well.

---

## Table of Contents

1. [What CourtLedger Is](#what-courtledger-is)
2. [Current Skills Inventory](#current-skills-inventory)
3. [Skills by Category](#skills-by-category)
4. [How Your Skills Map to CourtLedger](#how-your-skills-map-to-courtledger)
5. [Repository Map — Files to Know](#repository-map--files-to-know)
6. [Data Flow Walkthroughs](#data-flow-walkthroughs)
7. [Supabase in This Project](#supabase-in-this-project)
8. [Gap Analysis](#gap-analysis)
9. [Learning Path (8-Week Plan)](#learning-path-8-week-plan)
10. [Hands-On Project Exercises](#hands-on-project-exercises)
11. [Subject Deep Dives](#subject-deep-dives)
12. [DevOps & Deployment](#devops--deployment)
13. [Using Cursor Effectively](#using-cursor-effectively)
14. [Recommended Resources](#recommended-resources)
15. [CourtLedger Architecture Reference](#courtledger-architecture-reference)
16. [Skills Growth Tracker](#skills-growth-tracker)

---

## What CourtLedger Is

CourtLedger is **not** a sportsbook. It is a personal **NBA betting command center**:

| Capability | Where in the app |
| ---------- | ---------------- |
| Log bets (props, spreads, totals, etc.) | Command Center `/` — `BetForm.tsx` |
| Track pending vs settled, P/L, ROI | `useCourtLedgerData` + `utils/analytics.ts` |
| Filter, sort, duplicate, quick-grade | `betFiltering.ts`, `BetHistoryPage`, `ActiveBetsSection` |
| Export CSV / XLSX | `exportCsv.ts`, `exportXlsx.ts`, `ExportSection.tsx` |
| Bet slip OCR (camera/upload) | `BetSlipScanner.tsx`, `betSlipOcr.ts`, Tesseract.js |
| Per-bet stream embed | `StreamPanel.tsx` on Command Center |
| Auto-settle NBA player props (optional) | `BetForm` checkbox + Edge Function `sync-bet-settlements` |
| Official NBA YouTube highlights | Highlight Hub `/live` — Vercel proxy, not Supabase |
| Market / ROI views | `/markets`, `/analytics` — computed from your `bets` data |

**Auth:** Supabase email/password. **Data:** PostgreSQL with RLS per `user_id`.

**Removed (for now):** Bet Intelligence (`/intelligence`) — prop analyzer, odds APIs. You can rebuild it later; migration `bet_intelligence_reports` may still exist in Supabase but the app does not use it.

---

## Current Skills Inventory

### Languages

| Language     | Level / Notes                                      |
| ------------ | -------------------------------------------------- |
| Java         | Core language; OOP foundation                      |
| Python       | Scripting, automation, general-purpose             |
| SQL          | Queries, schema design, PostgreSQL                 |
| C            | Low-level fundamentals, memory & pointers          |
| JavaScript   | Browser runtime, async, DOM, fetch                 |
| TypeScript   | Typed JavaScript — primary language for CourtLedger |
| HTML         | Structure, semantics, accessibility basics         |
| CSS          | Layout, styling, responsive design                 |

### Frameworks & Libraries

| Tool              | Level / Notes                                      |
| ----------------- | -------------------------------------------------- |
| JavaFX            | **Proficient** — desktop UI, event-driven patterns |
| React             | **AI-Assisted** — components, hooks, state         |
| Next.js           | **AI-Assisted** — SSR, routing, API routes         |
| Tailwind CSS      | **AI-Assisted** — utility-first styling in CourtLedger |
| Recharts          | **(project)** — charts on `AnalyticsPage`          |
| React Router      | **(project)** — client routes in `App.tsx` (CourtLedger uses Vite, not Next.js) |

### Tools & Platforms

| Tool              | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| Git               | Version control, branches, diffs, history          |
| GitHub            | Remote repos, Actions, collaboration               |
| Linux             | Shell, servers, deployment environments            |
| Supabase          | Auth, PostgreSQL, RLS, edge functions              |
| PostgreSQL        | Relational database (via Supabase)                 |
| Vercel            | Hosting, serverless `/api/*`, env vars, CI deploy  |
| VS Code           | Primary editor; Cursor is VS Code–based            |
| IntelliJ IDEA     | Java IDE                                           |
| Wireshark         | Network packet capture and analysis                |
| Microsoft Office  | Documents, spreadsheets, presentations             |
| Google Workspace  | Docs, Sheets, collaboration                        |
| Tesseract.js      | **(project)** — bet slip OCR in `BetSlipScanner`    |

### Concepts

| Concept                  | Relevance to Building with Cursor                    |
| ------------------------ | ---------------------------------------------------- |
| REST APIs                | Client ↔ server communication (`/api/youtube-highlights`) |
| Authentication           | Supabase JWT, session tokens, protected routes       |
| Row-Level Security (RLS) | User-scoped data in PostgreSQL                       |
| OOP                      | Java foundation; maps to React component design      |
| Data Structures          | Arrays, objects, maps — core to JS/TS                  |
| Algorithms               | Sorting, filtering, scoring logic in app features    |
| SDLC                     | Plan → build → test → deploy → maintain              |
| Debugging                | Stack traces, browser DevTools, server logs          |
| Network Analysis         | HTTP, TCP/IP, Wireshark for troubleshooting         |
| TCP/IP                   | How requests travel from browser to server           |
| Cryptography Basics      | HTTPS, hashing, JWT structure                        |
| CI/CD                    | GitHub Actions, Vercel auto-deploy on push           |
| AI-Assisted Development  | Cursor prompts, diff review, iterative building      |

### Concepts — examples in CourtLedger **(project)**

| Concept        | Where you see it in this repo                          |
| -------------- | ------------------------------------------------------ |
| REST APIs      | `GET /api/youtube-highlights`                          |
| Authentication | `src/lib/auth.ts`, `AuthGate.tsx`                      |
| RLS            | `bets` rows scoped by `user_id`                        |
| Algorithms     | `computeSummaryStats`, `applyFiltersAndSort`           |
| CI/CD          | Push to `main` → Vercel; `.github/workflows/keepalive.yml` |

---

## Skills by Category

### Strong foundation (leverage these)

- **Java + OOP** — helps you read class-like patterns, interfaces, and separation of concerns in TypeScript.
- **C** — gives intuition for memory, pointers, and why some bugs are subtle.
- **SQL + PostgreSQL** — directly applies to Supabase migrations and RLS policies.
- **Data Structures & Algorithms** — filtering bets, sorting highlights, scoring logic.
- **Networking (TCP/IP, Wireshark)** — invaluable when API calls fail, CORS blocks, or env vars are wrong.
- **Cryptography basics** — understand JWT auth without treating tokens as magic strings.
- **Git + GitHub** — essential for every Cursor session; review diffs before commit.
- **JavaFX (proficient)** — you already know event-driven UI; React is the same idea with different syntax.

**In CourtLedger:** Java/OOP → `types/bets.ts` and `betsService.ts`; SQL → `bets` table; DS&A → `utils/analytics.ts`, `utils/betFiltering.ts`; networking → Highlight Hub 503s and auth errors.

### Growing with AI assistance (intentional practice targets)

- **React + TypeScript** — CourtLedger’s entire frontend.
- **Tailwind CSS** — all styling in the project.
- **Next.js** — useful for future apps; CourtLedger uses Vite + React Router instead.
- **Supabase + Vercel** — auth, database, serverless APIs in production.

**In CourtLedger:** Start at `App.tsx` → pages → `useCourtLedgerData.ts`; styling in `AppFrame.tsx` and `tailwind.config.ts`.

---

## How Your Skills Map to CourtLedger

| Feature | Key files | Your skills | Practice goal |
| ------- | --------- | ----------- | ------------- |
| Login / signup | `auth.ts`, `AuthGate.tsx`, `AuthForm.tsx` | Crypto, HTTP | Trace session from login to `session.user.id` |
| Add a bet | `BetForm.tsx` → `useCourtLedgerData.saveBet` → `betsService.ts` | SQL, OOP | Insert one row in Supabase Table Editor and match UI |
| Command Center | `CommandCenterPage.tsx`, `ActiveBetsSection.tsx` | DS&A, UI | Change one label without breaking layout |
| Bet History | `BetHistoryPage.tsx`, `BetRowActions.tsx` | SQL filters | Add a filter option in `BetsFilters.tsx` |
| ROI Analytics | `AnalyticsPage.tsx`, `utils/analytics.ts` | Algorithms | Explain how `winRate` is calculated |
| Market Intelligence | `MarketIntelligencePage.tsx` | Aggregation | Group bets by `market_type` mentally |
| Highlight Hub | `LiveCenterPage.tsx` → `youtubeHighlightsService.ts` → `api/youtube-highlights.ts` | REST, networking | Fix or mock a 503 with wrong env var |
| Export | `ExportSection.tsx`, `exportCsv.ts`, `exportXlsx.ts` | Data formats | Export your bets and open in Excel |
| Bet slip OCR | `BetSlipScanner.tsx`, `parseBetSlipText.ts` | Strings, regex | Read how OCR text becomes `BetDraft` |
| Auto-settle | `propSettlement.ts`, `supabase/functions/sync-bet-settlements` | SQL, cron | Read `auto_settle_enabled` column migration |
| Branding | `CourtLedgerLogo.tsx`, `public/court-ledger-logo.png` | CSS | Swap logo size in sidebar only |
| Keepalive | `api/keepalive.ts`, `.github/workflows/keepalive.yml` | CI/CD, Linux | Run `GET /api/keepalive` in browser |

### Original feature map (high level)

| CourtLedger piece              | Your existing skills              | What to practice                         |
| ------------------------------ | --------------------------------- | ---------------------------------------- |
| Bet logging & history          | SQL, OOP, data structures         | React forms, Supabase CRUD               |
| Auth & user-scoped data        | Cryptography, RLS concept         | Supabase auth flow, JWT in requests      |
| Highlight Hub (`/live`)        | REST APIs, JavaScript fetch       | Async/await, error states, embeds        |
| `/api/youtube-highlights`      | REST, networking, CI/CD           | Server env vars, Vercel redeploy         |
| Keepalive cron                 | Linux, GitHub Actions, CI/CD      | Workflow YAML, secrets, scheduled jobs   |
| Market Intelligence (`/markets`) | SQL, algorithms                 | Data aggregation, chart-ready views      |
| ROI Analytics                  | Algorithms, SDLC                  | Derived metrics, reusable hooks          |

---

## Repository Map — Files to Know **(project)**

```
CourtLedger/
├── api/
│   ├── keepalive.ts              # Server ping to Supabase (service role)
│   └── youtube-highlights.ts     # YouTube Data API proxy (server secret)
├── lib/
│   └── supabaseAdmin.ts          # Service-role client (keepalive only)
├── public/
│   ├── court-ledger-logo.png     # Full logo lockup
│   ├── favicon.png               # Icon-only (browser tab)
│   └── favicon-32.png
├── src/
│   ├── App.tsx                   # Routes + AppFrame wrapper
│   ├── main.tsx                  # React entry
│   ├── index.css                 # Global styles, .primary-gradient
│   ├── components/
│   │   ├── auth/                 # AuthGate, AuthForm, PublicHome
│   │   ├── bets/                 # BetForm, ActiveBets, SettledBets, OCR scanner
│   │   ├── branding/             # CourtLedgerLogo
│   │   ├── layout/               # AppFrame (sidebar, mobile nav)
│   │   ├── export/               # CSV/XLSX UI
│   │   └── stream/               # StreamPanel (embed URL per bet)
│   ├── hooks/
│   │   └── useCourtLedgerData.ts # Central state: bets, draft, filters, CRUD
│   ├── lib/
│   │   ├── supabase.ts           # Browser Supabase client (anon key)
│   │   ├── auth.ts               # signIn, signUp, signOut, getSession
│   │   ├── betsService.ts        # CRUD on `bets` table
│   │   ├── liveStatsService.ts   # Live stat cache + bet updates
│   │   └── youtubeHighlightsService.ts  # fetch('/api/youtube-highlights')
│   ├── pages/                    # One file per route
│   ├── types/                    # bets.ts, analytics.ts
│   └── utils/                    # analytics, filtering, grading, export, OCR parse
├── supabase/
│   ├── functions/sync-bet-settlements/  # Auto-grade props via balldontlie
│   └── migrations/               # SQL schema changes
├── .github/workflows/keepalive.yml
├── vercel.json                   # SPA rewrite + /api/* passthrough
├── tailwind.config.ts            # Colors: primary #4be277, surface #0b1326
├── package.json                  # npm scripts
├── .env.example                  # Local env template
└── README.md                     # Ops + deploy docs
```

### Recommended reading order (first time through the repo)

1. `src/main.tsx` → `App.tsx` → `AuthGate.tsx`
2. `src/lib/supabase.ts` + `src/lib/auth.ts`
3. `src/hooks/useCourtLedgerData.ts`
4. `src/lib/betsService.ts` + `src/types/bets.ts`
5. `src/pages/CommandCenterPage.tsx` + `src/components/bets/BetForm.tsx`
6. `src/components/layout/AppFrame.tsx`
7. `src/lib/youtubeHighlightsService.ts` + `api/youtube-highlights.ts`
8. `api/keepalive.ts` + `lib/supabaseAdmin.ts`

---

## Data Flow Walkthroughs

### A. User logs in

```
AuthForm submit
  → auth.ts signInWithPassword()
  → Supabase Auth (hosted)
  → JWT stored in browser
  → AuthGate sees session
  → CourtLedgerApp(session) mounts
  → useCourtLedgerData(session.user.id) loads bets
```

**Study:** `AuthGate.tsx`, `auth.ts`, `supabase.ts` (`persistSession: true`).

### B. User saves a bet

```
BetForm onSubmit
  → useCourtLedgerData.saveBet()
  → betsService.createBet() or updateBet()
  → supabase.from('bets').insert / .update
  → RLS ensures user_id matches auth.uid()
  → loadBets() refreshes list
  → CommandCenter shows active/settled sections
```

**Study:** `BetForm.tsx`, `useCourtLedgerData.ts` (search `saveBet`), `betsService.ts`.

### C. Analytics / markets (no extra API)

```
bets[] in memory (already loaded)
  → AnalyticsPage receives bets prop
  → computeSummaryStats(bets) in useMemo
  → Recharts renders profit / win rate
  → MarketIntelligencePage groups by market_type
```

**Study:** `utils/analytics.ts`, `AnalyticsPage.tsx`, `MarketIntelligencePage.tsx`.

### D. Highlight Hub (Vercel, not Supabase)

```
LiveCenterPage mount
  → youtubeHighlightsService.fetchHighlights()
  → fetch('/api/youtube-highlights')
  → api/youtube-highlights.ts (server)
  → YouTube Data API with YOUTUBE_DATA_API_KEY
  → JSON list of video IDs
  → iframe embeds youtube.com/embed/{id}
```

**Common prod bug:** 503 “Highlight service is not configured” → missing `YOUTUBE_DATA_API_KEY` on Vercel + redeploy.

**Study:** `LiveCenterPage.tsx`, `youtubeHighlightsService.ts`, `api/youtube-highlights.ts`.

### E. Keepalive (ops, not user-facing)

```
GitHub Actions cron (weekly)
  → GET https://court-ledger.vercel.app/api/keepalive
  → keepalive.ts uses service role
  → SELECT id FROM bets LIMIT 1
  → Keeps Supabase project from pausing on free tier
```

**Study:** `.github/workflows/keepalive.yml`, `api/keepalive.ts`.

---

## Supabase in This Project

| Piece | Role | Client |
| ----- | ---- | ------ |
| **Auth** | Email/password, sessions | Browser (`VITE_*` anon key) |
| **`bets` table** | All ledger data | `betsService.ts` |
| **`live_stats_cache`** | Live stat upserts | `liveStatsService.ts` |
| **`profiles`** | User profiles (if migrated) | Documented in README |
| **RLS** | Row access by `user_id` | Enforced server-side |
| **`sync-bet-settlements`** | Auto-grade pending props | Edge Function + service role |
| **Keepalive** | Tiny query to wake DB | Vercel `supabaseAdmin.ts` |

**Not stored in Supabase:** UI preferences on Settings (mostly `localStorage`), Highlight Hub videos (YouTube), logo PNGs (`public/`).

### Migrations in repo

| File | Purpose |
| ---- | ------- |
| `20260330140000_bets_auto_settle.sql` | Auto-settle columns on `bets` |
| `20260330120000_bet_intelligence_reports.sql` | Legacy table (app removed; optional cleanup) |

### npm scripts for Supabase

```bash
npm run dev              # Local app
npm run sb:login         # Supabase CLI login
npm run sb:link          # Link to your project ref
npm run sb:deploy:settle # Deploy sync-bet-settlements edge function
```

---

## Gap Analysis — What to Strengthen Next

Priority order based on CourtLedger and Cursor workflow:

1. **JavaScript async + HTTP** — You know networking theory; connect it to `fetch`, status codes, and JSON parsing in code.
2. **React hooks + component design** — Move from AI-assisted to confident: read `useCourtLedgerData` and trace data flow yourself first.
3. **TypeScript types** — Interfaces for API responses, props, and Supabase rows; catch bugs before runtime.
4. **Client vs server boundaries** — What runs in the browser (`VITE_*`) vs Vercel/Supabase (secrets never in client code).
5. **DevOps on Vercel + GitHub** — Env vars, redeploy after secret changes, read build logs.
6. **Supabase RLS** — Write and verify policies so users only see their own rows.

Less urgent for this project (but still valuable):

- Next.js (learn when starting a new SSR app; not required for CourtLedger today).
- JavaFX patterns (already proficient; React reuses the same mental model).

### Also prioritize in this codebase **(project)**

1. **Trace `useCourtLedgerData`** — spine of the app.
2. **React Router** — `App.tsx` paths and `AppFrame` titles.
3. **Vercel deploy loop** — push → build logs → prod URL.
4. **`types/bets.ts`** — until field names feel familiar.

---

## Learning Path (8-Week Plan)

| Week | Focus                         | Study                         | Apply in CourtLedger                                      |
| ---- | ----------------------------- | ----------------------------- | --------------------------------------------------------- |
| 1    | JS async, promises, fetch     | javascript.info (async)       | Trace Highlight Hub: page → service → `/api/*` → YouTube  |
| 2    | HTTP, status codes, CORS      | MDN HTTP guide                | Debug a failed API call; read Network tab in DevTools     |
| 3    | React components & props      | react.dev (Quick Start)       | Read one page component; draw its component tree          |
| 4    | React hooks (`useState`, `useEffect`) | react.dev (Hooks)     | Follow one hook from UI click to state update             |
| 5    | TypeScript basics             | TS Handbook (skim)            | Add types to a small utility or API response interface    |
| 6    | Env vars & serverless         | Vercel + Supabase docs        | Set `YOUTUBE_DATA_API_KEY`; redeploy; verify Highlight Hub |
| 7    | Supabase auth + RLS           | Supabase auth & RLS guides    | Trace how `user_id` scopes bets in migrations             |
| 8    | Git workflow + CI/CD          | GitHub Actions docs           | Review a push → Vercel deploy; read keepalive workflow    |

**Ongoing habits (every week):**

- Run `npm run lint` and `npm run build` after Cursor changes.
- Read the full diff before committing.
- Keep prompts small: one route, one API, one bug at a time.

### Same plan with repo file targets **(project)**

| Week | Focus | Read in repo | Outcome |
| ---- | ----- | ------------ | ------- |
| 1 | JS async + fetch | `youtubeHighlightsService.ts` | Draw Highlight Hub request diagram |
| 2 | HTTP + DevTools | Break env var on purpose locally | See 503/401 in Network tab |
| 3 | React components | `CommandCenterPage`, `BetForm` | List child components on paper |
| 4 | Hooks + state | `useCourtLedgerData.ts` | Explain `useMemo` for `summary` |
| 5 | TypeScript | `types/bets.ts`, `betsService.ts` | Add one optional field to a type |
| 6 | Vercel + env | README “Environment variables” | Set YouTube key, verify `/live` |
| 7 | Supabase + SQL | `betsService.ts`, Supabase Table Editor | Run manual SELECT for your user |
| 8 | Git + CI/CD | `keepalive.yml`, Vercel dashboard | Trace one deploy from push to live |

---

## Hands-On Project Exercises **(project)**

Do these in order. Use Cursor only when stuck — try reading first.

| # | Exercise | Success criteria |
| - | -------- | ---------------- |
| 1 | Run `npm run dev`, sign up, log one bet | Row appears in Supabase `bets` table |
| 2 | Change sidebar tagline “Tactical Command” in `AppFrame.tsx` | Visible after save, no build errors |
| 3 | Add `console.log` in `fetchBets`, watch Network tab | See Supabase REST call |
| 4 | Grade a bet Won/Lost from Command Center | `result_status` updates in DB |
| 5 | Export CSV from Command Center | File opens with your bet rows |
| 6 | Open `/live` with valid `YOUTUBE_DATA_API_KEY` | At least one embedded video |
| 7 | Call `/api/keepalive` in browser | JSON `{ ok: true }` |
| 8 | Read `computeSummaryStats` and verify ROI on Analytics | Numbers match manual check |
| 9 | Use Bet Slip Scanner on a screenshot | Draft fields partially filled |
| 10 | Push a one-line README edit, confirm Vercel deploy | Live site updates |

---

## Subject Deep Dives

### 1. Web fundamentals

- HTML structure, semantic tags, forms
- CSS: flexbox, grid, responsive breakpoints
- JavaScript: closures, arrays/objects, modules, async/await
- HTTP: methods, headers, cookies, CORS, common status codes (401, 403, 404, 503)

**Why:** Most production bugs are API, auth, or config — not CSS.

**CourtLedger:** `BetForm` inputs, `AppFrame` responsive layout, `fetch` in `youtubeHighlightsService.ts` and `betsService.ts`.

### 2. TypeScript + React

- Functional components, props, conditional rendering
- State: `useState`, derived state, lifting state up
- Effects: `useEffect` dependencies and cleanup
- Custom hooks for data fetching and shared logic
- Types: `interface`, union types, optional fields, generics (intro level)

**Why:** CourtLedger is React + TypeScript end to end; types make Cursor output easier to review.

**CourtLedger:** `Routes` / `Route` in `App.tsx`; `AppFrame` layout; `react-hot-toast`; `recharts` on `AnalyticsPage`; central hook `useCourtLedgerData.ts`.

### 3. Client–server architecture

- Browser (client) vs Vercel functions (server) vs Supabase (database/auth)
- Public env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Server-only secrets: `YOUTUBE_DATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- REST: JSON request/response shapes, error handling

**Why:** Highlight Hub failed in prod until server env was set — architecture knowledge prevents repeat issues.

| Runs in browser | Runs on Vercel server | Runs on Supabase |
| --------------- | --------------------- | ---------------- |
| React UI | `api/youtube-highlights.ts` | Auth |
| `VITE_SUPABASE_*` | `api/keepalive.ts` | Postgres `bets` |
| `localStorage` prefs | `YOUTUBE_DATA_API_KEY` | Edge `sync-bet-settlements` |

### 4. Databases & auth

- SQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, indexes, migrations
- Supabase: Auth signup/login, JWT in requests
- RLS: policies that restrict rows by `auth.uid()`

**Why:** Security and data integrity depend on RLS, not just frontend checks.

**CourtLedger:** Supabase Dashboard → Authentication → Users; Table Editor → `bets` filtered by `user_id`.

### 5. Software design

- Separation: pages → components → services → API routes
- Single responsibility: one file, one job
- Reading stack traces: file, line, error message
- Refactoring: delete dead code, small focused diffs

**Why:** Helps you prompt Cursor precisely (“remove route and nav only, keep migration”).

| Layer | CourtLedger example |
| ----- | ------------------- |
| Page | `CommandCenterPage.tsx` |
| Component | `BetForm.tsx` |
| Hook | `useCourtLedgerData.ts` |
| Service | `betsService.ts` |
| Util | `grading.ts`, `profit.ts` |
| API route | `api/youtube-highlights.ts` |

### 6. Algorithms & data structures (applied)

- Filter/map/reduce on bet lists and analytics
- Sorting by date, ROI, stake
- Lookup maps (`Record<string, T>`) for O(1) access by id

**Why:** You already studied DS&A; web apps use the same ideas in JavaScript daily.

**CourtLedger:** `applyFiltersAndSort`, `computeSummaryStats`, `calculateTargetRemaining`, `propSettlement.ts` (keep in sync with Edge Function).

---

## DevOps & Deployment

Topics to connect your Linux, Git, GitHub, and CI/CD knowledge to CourtLedger:

| Topic                    | What it means here                                      |
| ------------------------ | ------------------------------------------------------- |
| **Git workflow**         | Feature branch optional; commit small; push to `main`   |
| **GitHub Actions**       | `.github/workflows/keepalive.yml` — weekly cron ping    |
| **Vercel deploy**        | Push triggers build; env vars require redeploy          |
| **Environment secrets**  | Never commit `.env`; use Vercel dashboard + Supabase    |
| **Serverless functions** | `api/*.ts` — short-lived Node handlers on Vercel        |
| **Logs & debugging**     | Vercel function logs, browser Network/Console tabs     |
| **Linux shell**          | `npm run build`, git commands, optional local Supabase  |
| **CI/CD loop**           | Code → commit → push → build → deploy → verify prod URL |

**Checklist before calling a feature “done”:**

- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] New env vars documented in `.env.example` and README
- [ ] Secrets set in Vercel (Production) and redeployed
- [ ] Tested on production URL, not only localhost

### CourtLedger specifics **(project)**

| Topic | Details |
| ----- | ------- |
| **Local dev** | `npm run dev` → usually `http://localhost:5173` |
| **Build** | `tsc -b && vite build` → `dist/` |
| **Hosting** | `vercel.json` rewrites non-API to `index.html` |
| **Keepalive** | Update workflow URL if deployment hostname changes |
| **Supabase CLI** | `npm run sb:deploy:settle` for auto-settle function |

### Environment variables (this project)

| Variable | Where | Used for |
| -------- | ----- | -------- |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Auth + bet CRUD (RLS) |
| `YOUTUBE_DATA_API_KEY` | Vercel server | Highlight Hub |
| `SUPABASE_URL` | Vercel server | Keepalive |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel server | Keepalive (bypasses RLS) |
| `BALLDONTLIE_API_KEY` | Supabase Edge secret | Auto-settle only |

---

## Using Cursor Effectively

### Prompt patterns that work

1. **Explain first:** “Walk through the data flow in `youtubeHighlightsService.ts`.”
2. **Constrained change:** “Remove the `/intelligence` route and nav only; minimal diff.”
3. **Match conventions:** “Add a loading state like the existing bet list pattern.”
4. **Verify:** “Run lint and build after changes.”

### Review checklist for AI-generated code

- Does it match existing file structure and naming?
- Are secrets only on the server?
- Are types accurate for API responses?
- Is error handling present for fetch failures?
- Is the diff smaller than necessary? Ask to simplify.

### What Cursor is good at

- Boilerplate, CRUD UI, API route scaffolding
- Refactors across many files
- README and migration SQL drafts
- Repetitive Tailwind layout

### What you must own

- Security (RLS, auth, env vars)
- Production config (Vercel, Supabase dashboard)
- Product decisions (what to build vs defer)
- Final review before commit and push

### Patterns from this repo **(project)**

- “Explain data flow from `BetForm` submit to Supabase `bets` insert.”
- **Remove a feature:** route in `App.tsx`, nav in `AppFrame.tsx`, pages/services/API together.
- **Add branding:** `public/` assets, `CourtLedgerLogo.tsx`, `index.html` favicon.
- **Proxy external API:** never put `YOUTUBE_DATA_API_KEY` in client — use `api/*.ts`.

---

## Recommended Resources

### Free

| Resource | Topic |
| -------- | ----- |
| [javascript.info](https://javascript.info) | Modern JavaScript, async |
| [React docs](https://react.dev/learn) | Components, hooks |
| [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | Types (skim, reference as needed) |
| [MDN Web Docs](https://developer.mozilla.org) | HTTP, fetch, CORS, HTML, CSS |
| [Supabase docs](https://supabase.com/docs) | Auth, database, RLS, edge functions |
| [Vercel docs](https://vercel.com/docs) | Deployment, serverless, env vars |
| [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html) | SQL depth |
| [React Router docs](https://reactrouter.com) | **(project)** `App.tsx` routing |
| [Tailwind docs](https://tailwindcss.com/docs) | **(project)** `AppFrame`, `BetForm` |
| [Recharts](https://recharts.org) | **(project)** `AnalyticsPage` |
| This repo’s `README.md` | **(project)** deploy, migrations, troubleshooting |

### Practice projects (beyond CourtLedger)

- **Todo app with Supabase auth** — CRUD + RLS in one weekend
- **Weather dashboard** — external REST API + loading/error UI
- **Personal API** — one Vercel function + typed client hook

---

## CourtLedger Architecture Reference

Quick map for study and debugging:

```
Browser (React + Vite + Tailwind)
    │
    ├── Supabase client ──► Auth + PostgreSQL (bets, profiles, …)
    │
    └── fetch("/api/...") ──► Vercel serverless
            ├── youtube-highlights.ts  (YouTube Data API)
            └── keepalive.ts           (Supabase ping)

GitHub Actions (weekly) ──► GET /api/keepalive
```

### Current routes

| Route        | Page                 |
| ------------ | -------------------- |
| `/`          | Command Center       |
| `/history`   | Bet History          |
| `/live`      | Highlight Hub        |
| `/markets`   | Market Intelligence  |
| `/analytics` | ROI Analytics        |
| `/settings`  | Settings             |

### Production env vars (reference)

| Variable | Where | Purpose |
| -------- | ----- | ------- |
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Public anon key |
| `YOUTUBE_DATA_API_KEY` | Server (Vercel) | Highlight Hub |
| `SUPABASE_URL` | Server | Keepalive / admin |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Keepalive / admin |

---

### Extended reference **(project)**

### Stack

| Layer | Technology |
| ----- | ---------- |
| UI | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Routing | React Router 7 |
| Data / auth | Supabase (JS client v2) |
| Charts | Recharts |
| OCR | Tesseract.js |
| Export | SheetJS (`xlsx`) |
| Hosting | Vercel (static + serverless) |

### Diagram

```
Browser (React + Vite + Tailwind)
    │
    ├── supabase.ts (anon) ──► Supabase Auth
    │                      └──► PostgreSQL: bets, live_stats_cache, profiles
    │
    └── fetch("/api/...") ──► Vercel
            ├── youtube-highlights.ts → YouTube Data API
            └── keepalive.ts → Supabase (service role)

Supabase Edge: sync-bet-settlements → balldontlie → update bets

GitHub Actions (weekly) → GET /api/keepalive
```

### Routes (current)

| Route | Page file | Purpose |
| ----- | --------- | ------- |
| `/` | `CommandCenterPage.tsx` | Bet form, active/settled, export, stream |
| `/history` | `BetHistoryPage.tsx` | Full ledger |
| `/live` | `LiveCenterPage.tsx` | Highlight Hub |
| `/markets` | `MarketIntelligencePage.tsx` | Market breakdown |
| `/analytics` | `AnalyticsPage.tsx` | ROI charts |
| `/settings` | `SettingsPage.tsx` | Account + local prefs |

Unauthenticated users see `PublicHome.tsx` → login via `AuthForm.tsx`.

### Design tokens (branding)

| Token | Value | Usage |
| ----- | ----- | ----- |
| `primary` | `#4be277` | Buttons, accents, logo green |
| `surface` | `#0b1326` | App background |
| `secondary` | `#ffb95f` | Amber accents |
| Fonts | Manrope (headlines), Inter (body) | `tailwind.config.ts`, `index.html` |
| Logo | `public/court-ledger-logo.png` | `CourtLedgerLogo.tsx` |

### Key dependencies (`package.json`)

`@supabase/supabase-js`, `react-router-dom`, `recharts`, `tesseract.js`, `xlsx`, `react-hot-toast`

---

## Skills Growth Tracker

Copy this section and update monthly:

| Skill area | Start level | Target (3 mo) | Notes |
| ---------- | ----------- | ------------- | ----- |
| React + TS | AI-Assisted | Confident reader | Trace hooks without AI |
| Tailwind   | AI-Assisted | Confident reader | Adjust layouts from docs |
| Supabase   | AI-Assisted | Independent     | Write RLS policies |
| Vercel/API | AI-Assisted | Independent     | Debug 503/env issues |
| DevOps/CI  | Conceptual  | Hands-on        | Own deploy + Actions |
| Cursor     | Active user | Power user      | Small prompts, sharp reviews |
| CourtLedger codebase | Learning | Maintainer | Can add a route end-to-end |

---

*Last updated: May 2026 — CourtLedger `main`: Highlight Hub, keepalive, logo branding, Bet Intelligence removed.*

# CourtLedger Developer Learning Guide

A personal roadmap for building full-stack web apps with Cursor, centered on the CourtLedger project stack (React, TypeScript, Supabase, Vercel).

Use this document with an online Markdown converter when you need a PDF, Word doc, or printable version.

---

## Table of Contents

1. [Current Skills Inventory](#current-skills-inventory)
2. [Skills by Category](#skills-by-category)
3. [How Your Skills Map to CourtLedger](#how-your-skills-map-to-courtledger)
4. [Gap Analysis — What to Strengthen Next](#gap-analysis--what-to-strengthen-next)
5. [Learning Path (8-Week Plan)](#learning-path-8-week-plan)
6. [Subject Deep Dives](#subject-deep-dives)
7. [DevOps & Deployment](#devops--deployment)
8. [Using Cursor Effectively](#using-cursor-effectively)
9. [Recommended Resources](#recommended-resources)
10. [CourtLedger Architecture Reference](#courtledger-architecture-reference)

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

### Growing with AI assistance (intentional practice targets)

- **React + TypeScript** — CourtLedger’s entire frontend.
- **Tailwind CSS** — all styling in the project.
- **Next.js** — useful for future apps; CourtLedger uses Vite + React Router instead.
- **Supabase + Vercel** — auth, database, serverless APIs in production.

---

## How Your Skills Map to CourtLedger

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

---

## Subject Deep Dives

### 1. Web fundamentals

- HTML structure, semantic tags, forms
- CSS: flexbox, grid, responsive breakpoints
- JavaScript: closures, arrays/objects, modules, async/await
- HTTP: methods, headers, cookies, CORS, common status codes (401, 403, 404, 503)

**Why:** Most production bugs are API, auth, or config — not CSS.

### 2. TypeScript + React

- Functional components, props, conditional rendering
- State: `useState`, derived state, lifting state up
- Effects: `useEffect` dependencies and cleanup
- Custom hooks for data fetching and shared logic
- Types: `interface`, union types, optional fields, generics (intro level)

**Why:** CourtLedger is React + TypeScript end to end; types make Cursor output easier to review.

### 3. Client–server architecture

- Browser (client) vs Vercel functions (server) vs Supabase (database/auth)
- Public env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Server-only secrets: `YOUTUBE_DATA_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- REST: JSON request/response shapes, error handling

**Why:** Highlight Hub failed in prod until server env was set — architecture knowledge prevents repeat issues.

### 4. Databases & auth

- SQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, indexes, migrations
- Supabase: Auth signup/login, JWT in requests
- RLS: policies that restrict rows by `auth.uid()`

**Why:** Security and data integrity depend on RLS, not just frontend checks.

### 5. Software design

- Separation: pages → components → services → API routes
- Single responsibility: one file, one job
- Reading stack traces: file, line, error message
- Refactoring: delete dead code, small focused diffs

**Why:** Helps you prompt Cursor precisely (“remove route and nav only, keep migration”).

### 6. Algorithms & data structures (applied)

- Filter/map/reduce on bet lists and analytics
- Sorting by date, ROI, stake
- Lookup maps (`Record<string, T>`) for O(1) access by id

**Why:** You already studied DS&A; web apps use the same ideas in JavaScript daily.

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

---

*Last updated: May 2026 — aligned with CourtLedger `main` after Bet Intelligence removal.*

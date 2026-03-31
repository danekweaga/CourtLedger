/**
 * One Odds API call (player_points + rebounds + assists, region=us) + light balldontlie usage
 * to return up to 5 scenarios ranked by devigged implied probability (favorite side per line).
 *
 * Secrets (Supabase Dashboard → Edge Functions → Secrets):
 *   THE_ODDS_API_KEY
 *   BALLDONTLIE_API_KEY
 *
 * Auto-provided: SUPABASE_URL, SUPABASE_ANON_KEY
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ODDS_BASE = "https://api.the-odds-api.com/v4";
const BDL_BASE = "https://api.balldontlie.io/v1";

const MARKETS = "player_points,player_rebounds,player_assists";
const MARKET_TO_APP: Record<string, string> = {
  player_points: "points",
  player_rebounds: "rebounds",
  player_assists: "assists",
};

interface OddsEvent {
  id: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: {
    key: string;
    markets?: { key: string; outcomes?: { name: string; description?: string | null; price: number; point?: number | null }[] }[];
  }[];
}

interface BdlTeam {
  full_name: string;
  abbreviation: string;
  name: string;
  city: string;
}

interface BdlPlayer {
  id: number;
  first_name: string;
  last_name: string;
  team?: BdlTeam | null;
}

type Bucket = {
  event: OddsEvent;
  marketKey: string;
  player: string;
  point: number;
  overPrices: number[];
  underPrices: number[];
};

function impliedAmerican(american: number): number {
  if (american > 0) {
    return 100 / (american + 100);
  }
  const a = Math.abs(american);
  return a / (a + 100);
}

function median(nums: number[]): number | null {
  if (nums.length === 0) {
    return null;
  }
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function bdlFetch(path: string, apiKey: string): Promise<unknown> {
  await sleep(90);
  const res = await fetch(`${BDL_BASE}${path}`, { headers: { Authorization: apiKey } });
  if (!res.ok) {
    throw new Error(`balldontlie ${res.status}: ${(await res.text()).slice(0, 120)}`);
  }
  return res.json();
}

function playerSideOnEvent(p: BdlPlayer, ev: OddsEvent): "home" | "away" | null {
  const t = p.team;
  if (!t) {
    return null;
  }
  if (ev.home_team === t.full_name || ev.home_team.includes(t.name)) {
    return "home";
  }
  if (ev.away_team === t.full_name || ev.away_team.includes(t.name)) {
    return "away";
  }
  return null;
}

function abbrFromEventTeam(eventTeamName: string, teams: BdlTeam[]): string {
  const exact = teams.find((x) => x.full_name === eventTeamName);
  if (exact) {
    return exact.abbreviation;
  }
  const byNick = teams.find((x) => eventTeamName.includes(x.name) || eventTeamName.includes(x.city));
  return byNick?.abbreviation ?? eventTeamName.slice(0, 3).toUpperCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const oddsKey = Deno.env.get("THE_ODDS_API_KEY");
  const bdlKey = Deno.env.get("BALLDONTLIE_API_KEY");

  if (!supabaseUrl || !anonKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), { status: 500 });
  }
  if (!oddsKey) {
    return new Response(JSON.stringify({ error: "Set Edge Function secret THE_ODDS_API_KEY" }), { status: 500 });
  }
  if (!bdlKey) {
    return new Response(JSON.stringify({ error: "Set Edge Function secret BALLDONTLIE_API_KEY" }), { status: 500 });
  }

  const jsonHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), { status: 401, headers: jsonHeaders });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    const msg = userErr?.message ?? "Unauthorized";
    return new Response(JSON.stringify({ error: msg }), { status: 401, headers: jsonHeaders });
  }

  const oddsUrl =
    `${ODDS_BASE}/sports/basketball_nba/odds/?regions=us&markets=${MARKETS}&oddsFormat=american&apiKey=${encodeURIComponent(oddsKey)}`;
  const oddsRes = await fetch(oddsUrl);
  const oddsRemaining = oddsRes.headers.get("x-requests-remaining");
  const oddsUsed = oddsRes.headers.get("x-requests-used");
  if (!oddsRes.ok) {
    const t = await oddsRes.text();
    return new Response(JSON.stringify({ error: `Odds API ${oddsRes.status}`, detail: t.slice(0, 200) }), {
      status: 502,
    });
  }

  const events = (await oddsRes.json()) as OddsEvent[];
  const buckets = new Map<string, Bucket>();

  for (const event of events ?? []) {
    for (const book of event.bookmakers ?? []) {
      for (const market of book.markets ?? []) {
        const appMarket = MARKET_TO_APP[market.key];
        if (!appMarket) {
          continue;
        }
        for (const o of market.outcomes ?? []) {
          const player = (o.description ?? "").trim();
          const pt = o.point;
          if (!player || pt == null || typeof o.price !== "number") {
            continue;
          }
          const side = o.name.trim().toLowerCase();
          if (side !== "over" && side !== "under") {
            continue;
          }
          const key = `${event.id}|${market.key}|${player}|${pt}`;
          let b = buckets.get(key);
          if (!b) {
            b = { event, marketKey: market.key, player, point: pt, overPrices: [], underPrices: [] };
            buckets.set(key, b);
          }
          if (side === "over") {
            b.overPrices.push(o.price);
          } else {
            b.underPrices.push(o.price);
          }
        }
      }
    }
  }

  type Scored = Bucket & {
    confidence: number;
    side: "over" | "under";
    medOver: number | null;
    medUnder: number | null;
    oddsPick: number;
  };

  const scored: Scored[] = [];
  for (const b of buckets.values()) {
    const medOver = median(b.overPrices);
    const medUnder = median(b.underPrices);
    if (medOver == null || medUnder == null) {
      continue;
    }
    const pO = impliedAmerican(medOver);
    const pU = impliedAmerican(medUnder);
    const sum = pO + pU;
    if (sum <= 0) {
      continue;
    }
    const nO = pO / sum;
    const nU = pU / sum;
    const side = nO >= nU ? "over" : "under";
    const confidence = Math.max(nO, nU);
    const oddsPick = side === "over" ? medOver : medUnder;
    scored.push({ ...b, medOver, medUnder, confidence, side, oddsPick });
  }

  scored.sort((a, b) => b.confidence - a.confidence);

  const teamsJson = (await bdlFetch("/teams", bdlKey)) as { data: BdlTeam[] };
  const allTeams = teamsJson.data ?? [];

  const scenarios: Record<string, unknown>[] = [];
  const seenKeys = new Set<string>();
  const maxAttempts = 18;
  let attempts = 0;

  for (const row of scored) {
    if (scenarios.length >= 5) {
      break;
    }
    if (attempts >= maxAttempts) {
      break;
    }

    const searchQ = encodeURIComponent(row.player.replace(/\s+/g, " ").trim().slice(0, 40));
    let players: BdlPlayer[] = [];
    try {
      attempts += 1;
      const pj = (await bdlFetch(`/players?search=${searchQ}&per_page=15`, bdlKey)) as { data: BdlPlayer[] };
      players = pj.data ?? [];
    } catch {
      continue;
    }

    const onEvent = players.filter((p) => playerSideOnEvent(p, row.event) !== null);
    const pool = onEvent.length > 0 ? onEvent : players;
    const pick = pool.find((p) => p.team?.abbreviation) ?? pool[0];
    if (!pick?.team?.abbreviation) {
      continue;
    }

    const side = playerSideOnEvent(pick, row.event);
    if (!side) {
      continue;
    }

    const homeAbbr = abbrFromEventTeam(row.event.home_team, allTeams);
    const awayAbbr = abbrFromEventTeam(row.event.away_team, allTeams);
    const team = pick.team.abbreviation;
    const opponent = side === "home" ? awayAbbr : homeAbbr;

    const dedupe = `${pick.id}|${row.marketKey}|${row.point}|${row.side}`;
    if (seenKeys.has(dedupe)) {
      continue;
    }
    seenKeys.add(dedupe);

    const impliedPct = (impliedAmerican(row.oddsPick) * 100).toFixed(1);
    scenarios.push({
      player_name: `${pick.first_name} ${pick.last_name}`.trim(),
      team,
      opponent,
      market_type: MARKET_TO_APP[row.marketKey] ?? "points",
      over_under: row.side,
      line: row.point,
      opening_line: null,
      current_odds: Math.round(row.oddsPick),
      recent_form: `Board median ~${(row.confidence * 100).toFixed(1)}% devig favorite side (not a win guarantee).`,
      matchup_notes: `${row.event.home_team} vs ${row.event.away_team} · Odds-implied ${impliedPct}% on listed price.`,
      injury_context: "",
      home_away: side === "home" ? "home" : "away",
      rest_days: null,
      opponent_pace_rank: null,
      role_shift_notes: "",
      notes:
        "Filled by nba-odds-slate (The Odds API + balldontlie). For entertainment only; verify lines on your book.",
    });
  }

  return new Response(
    JSON.stringify({
      scenarios,
      count: scenarios.length,
      odds_requests_remaining: oddsRemaining,
      odds_requests_used: oddsUsed,
      disclaimer:
        "Rank uses consensus median prices across US books in the API response, then two-way devig. This is not betting advice and is not a guarantee of results.",
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
});

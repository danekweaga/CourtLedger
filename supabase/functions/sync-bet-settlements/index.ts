/**
 * Grades pending bets with auto_settle_enabled using balldontlie NBA box scores.
 * Keep settlement math aligned with src/utils/propSettlement.ts and src/utils/grading.ts.
 *
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BALLDONTLIE_API_KEY
 * Optional: CRON_SECRET — when set, require header x-cron-secret matching the value.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BDL_BASE = "https://api.balldontlie.io/v1";

const SUPPORTED_MARKETS = new Set([
  "points",
  "rebounds",
  "assists",
  "threes_made",
  "pra",
  "steals",
  "blocks",
  "turnovers",
]);

interface BetRow {
  id: string;
  player_name: string;
  team: string;
  opponent: string;
  game_date: string;
  market_type: string;
  over_under: string | null;
  line: number | null;
  odds: number;
  stake: number;
  notes: string | null;
  cash_out_amount: number | null;
  stats_player_id: number | null;
  stats_game_id: number | null;
  result_status: string;
}

interface BdlTeam {
  id: number;
  abbreviation: string;
  full_name: string;
  name: string;
}

interface BdlGame {
  id: number;
  date: string;
  status: string;
  home_team: BdlTeam;
  visitor_team: BdlTeam;
}

interface BdlPlayer {
  id: number;
  first_name: string;
  last_name: string;
  team?: BdlTeam | null;
}

interface BdlStatRow {
  pts: number;
  reb: number;
  ast: number;
  fg3m: number;
  stl: number;
  blk: number;
  turnover: number;
  player: BdlPlayer;
  game: { id: number; status: string };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function bdlJson(pathWithQuery: string, apiKey: string): Promise<unknown> {
  await sleep(85);
  const res = await fetch(`${BDL_BASE}${pathWithQuery}`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`balldontlie HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json();
}

function teamTokenMatches(teamField: string, apiTeam: BdlTeam): boolean {
  const t = teamField.trim();
  if (!t) return false;
  const u = t.toUpperCase();
  if (apiTeam.abbreviation.toUpperCase() === u) return true;
  const fn = apiTeam.full_name.toLowerCase();
  const tl = t.toLowerCase();
  return fn.includes(tl) || apiTeam.name.toLowerCase().includes(tl);
}

function gameMatchesBetTeams(g: BdlGame, team: string, opponent: string): boolean {
  const sides: [BdlTeam, BdlTeam][] = [
    [g.home_team, g.visitor_team],
    [g.visitor_team, g.home_team],
  ];
  return sides.some(([a, b]) => teamTokenMatches(team, a) && teamTokenMatches(opponent, b));
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\./g, "");
}

function playerNameScore(betName: string, p: BdlPlayer): number {
  const full = `${p.first_name} ${p.last_name}`.toLowerCase();
  const b = normalizeName(betName);
  if (!b) return 0;
  if (full === b) return 100;
  if (full.includes(b) || b.includes(full)) return 85;
  const last = p.last_name.toLowerCase();
  const parts = b.split(/\s+/).filter(Boolean);
  if (parts.length && last === parts[parts.length - 1]) return 65;
  return 0;
}

async function resolvePlayerId(bet: BetRow, apiKey: string): Promise<{ id: number; error?: string }> {
  if (bet.stats_player_id != null && Number.isFinite(bet.stats_player_id)) {
    return { id: bet.stats_player_id };
  }
  const q = encodeURIComponent(bet.player_name.trim().slice(0, 48));
  if (!q) {
    return { id: -1, error: "Missing player name" };
  }
  const json = (await bdlJson(`/players?search=${q}&per_page=25`, apiKey)) as { data: BdlPlayer[] };
  const rows = json.data ?? [];
  const teamHint = bet.team.trim().toUpperCase();
  let candidates = rows.map((p) => ({
    p,
    score: playerNameScore(bet.player_name, p) + (p.team?.abbreviation.toUpperCase() === teamHint ? 15 : 0),
  }));
  candidates = candidates.filter((c) => c.score >= 55);
  candidates.sort((a, b) => b.score - a.score);
  if (candidates.length === 0) {
    return { id: -1, error: "Player not found in stats API" };
  }
  if (candidates.length >= 2 && candidates[0].score - candidates[1].score < 4) {
    return { id: -1, error: "Ambiguous player match; set Stats API player id on the bet" };
  }
  return { id: candidates[0].p.id };
}

async function findFinalGameForBet(bet: BetRow, apiKey: string): Promise<{ id: number; error?: string }> {
  if (bet.stats_game_id != null && Number.isFinite(bet.stats_game_id)) {
    const json = (await bdlJson(`/games/${bet.stats_game_id}`, apiKey)) as { data?: BdlGame };
    const g = json.data;
    if (!g) {
      return { id: -1, error: "Cached stats game id is invalid" };
    }
    if (g.status === "Final") {
      return { id: g.id };
    }
    return { id: -1, error: "Cached game is not final yet" };
  }
  const d = bet.game_date;
  const json = (await bdlJson(`/games?dates[]=${d}&per_page=100`, apiKey)) as { data: BdlGame[] };
  const games = (json.data ?? []).filter((g) => g.status === "Final" && gameMatchesBetTeams(g, bet.team, bet.opponent));
  if (games.length === 0) {
    return { id: -1, error: "No final game matched team/opponent on game date" };
  }
  if (games.length > 1) {
    return { id: -1, error: "Multiple games matched; set Stats API game id on the bet" };
  }
  return { id: games[0].id };
}

function finalStatFromBox(marketType: string, row: BdlStatRow): number | null {
  switch (marketType) {
    case "points":
      return row.pts;
    case "rebounds":
      return row.reb;
    case "assists":
      return row.ast;
    case "threes_made":
      return row.fg3m;
    case "steals":
      return row.stl;
    case "blocks":
      return row.blk;
    case "turnovers":
      return row.turnover;
    case "pra":
      return row.pts + row.reb + row.ast;
    default:
      return null;
  }
}

function settlePlayerProp(
  marketType: string,
  line: number | null,
  overUnder: string | null,
  finalStat: number,
): "win" | "loss" | "push" | null {
  if (line == null || overUnder == null) return null;
  if (!SUPPORTED_MARKETS.has(marketType)) return null;
  const eps = 1e-6;
  if (overUnder === "over") {
    if (finalStat > line + eps) return "win";
    if (finalStat < line - eps) return "loss";
    return "push";
  }
  if (finalStat < line - eps) return "win";
  if (finalStat > line + eps) return "loss";
  return "push";
}

function americanOddsToDecimal(odds: number): number {
  if (odds === 0) return 1;
  if (odds > 0) return odds / 100 + 1;
  return 100 / Math.abs(odds) + 1;
}

function computeProfitForResult(stake: number, odds: number, resultStatus: "win" | "loss" | "push"): number {
  const dec = americanOddsToDecimal(odds);
  const payout = Number((stake * dec).toFixed(2));
  switch (resultStatus) {
    case "win":
      return Number((payout - stake).toFixed(2));
    case "loss":
      return Number((-stake).toFixed(2));
    case "push":
      return 0;
    default:
      return 0;
  }
}

function calculateTargetRemaining(line: number | null, currentStat: number | null, overUnder: string | null): number | null {
  if (line == null || currentStat == null) return null;
  if (overUnder === "under") return Number((currentStat - line).toFixed(2));
  return Number((line - currentStat).toFixed(2));
}

async function fetchStatRow(gameId: number, playerId: number, apiKey: string): Promise<BdlStatRow | null> {
  const json = (await bdlJson(`/stats?game_ids[]=${gameId}&player_ids[]=${playerId}&per_page=100`, apiKey)) as {
    data: BdlStatRow[];
  };
  const rows = json.data ?? [];
  const hit = rows.find((r) => r.player?.id === playerId && r.game?.id === gameId);
  return hit ?? rows[0] ?? null;
}

function inDateWindow(gameDate: string): boolean {
  const d = new Date(`${gameDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 8);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 1);
  return d >= start && d <= end;
}

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const h = req.headers.get("x-cron-secret");
    if (h !== cronSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = Deno.env.get("BALLDONTLIE_API_KEY");

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing BALLDONTLIE_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data: rows, error: fetchError } = await supabase
    .from("bets")
    .select(
      "id, player_name, team, opponent, game_date, market_type, over_under, line, odds, stake, notes, cash_out_amount, stats_player_id, stats_game_id, result_status, auto_settle_enabled",
    )
    .eq("auto_settle_enabled", true)
    .eq("result_status", "pending");

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const bets = (rows ?? []) as BetRow[];
  const eligible = bets.filter((b) => inDateWindow(b.game_date));
  const results: { id: string; ok: boolean; detail?: string }[] = [];

  for (const bet of eligible) {
    try {
      if (!SUPPORTED_MARKETS.has(bet.market_type)) {
        await supabase
          .from("bets")
          .update({
            auto_settle_error: `Unsupported market for auto-settle: ${bet.market_type}`,
            last_auto_settle_at: new Date().toISOString(),
          })
          .eq("id", bet.id);
        results.push({ id: bet.id, ok: false, detail: "unsupported_market" });
        continue;
      }

      const gameR = await findFinalGameForBet(bet, apiKey);
      if (gameR.id < 0) {
        const silent =
          !gameR.error ||
          gameR.error.includes("not final yet") ||
          gameR.error === "No final game matched team/opponent on game date";
        if (!silent) {
          await supabase
            .from("bets")
            .update({
              auto_settle_error: gameR.error,
              last_auto_settle_at: new Date().toISOString(),
            })
            .eq("id", bet.id);
        }
        results.push({ id: bet.id, ok: false, detail: gameR.error });
        continue;
      }

      const playerR = await resolvePlayerId(bet, apiKey);
      if (playerR.id < 0) {
        await supabase
          .from("bets")
          .update({
            auto_settle_error: playerR.error ?? "Player resolution failed",
            last_auto_settle_at: new Date().toISOString(),
            stats_game_id: gameR.id,
          })
          .eq("id", bet.id);
        results.push({ id: bet.id, ok: false, detail: playerR.error });
        continue;
      }

      const statRow = await fetchStatRow(gameR.id, playerR.id, apiKey);
      if (!statRow) {
        await supabase
          .from("bets")
          .update({
            auto_settle_error: "No box score row for player/game",
            last_auto_settle_at: new Date().toISOString(),
            stats_player_id: playerR.id,
            stats_game_id: gameR.id,
          })
          .eq("id", bet.id);
        results.push({ id: bet.id, ok: false, detail: "no_stat_row" });
        continue;
      }

      const finalStat = finalStatFromBox(bet.market_type, statRow);
      if (finalStat == null) {
        await supabase
          .from("bets")
          .update({
            auto_settle_error: "Could not read stat from box score",
            last_auto_settle_at: new Date().toISOString(),
            stats_player_id: playerR.id,
            stats_game_id: gameR.id,
          })
          .eq("id", bet.id);
        results.push({ id: bet.id, ok: false, detail: "stat_read" });
        continue;
      }

      const outcome = settlePlayerProp(bet.market_type, bet.line, bet.over_under, finalStat);
      if (outcome == null) {
        results.push({ id: bet.id, ok: false, detail: "settle_null" });
        continue;
      }

      const netProfit = computeProfitForResult(bet.stake, bet.odds, outcome);
      const baseNotes = bet.notes ?? "";
      const netSuffix = `Net ${netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}`;
      const notes = `${baseNotes} ${netSuffix}`.trim();

      const targetRemaining = calculateTargetRemaining(bet.line, finalStat, bet.over_under);

      const { error: upErr } = await supabase
        .from("bets")
        .update({
          result_status: outcome,
          live_status: "finished",
          current_stat_value: finalStat,
          target_remaining: targetRemaining,
          game_status: "Final",
          notes,
          stats_player_id: playerR.id,
          stats_game_id: gameR.id,
          auto_settle_error: null,
          last_auto_settle_at: new Date().toISOString(),
        })
        .eq("id", bet.id);

      if (upErr) {
        results.push({ id: bet.id, ok: false, detail: upErr.message });
      } else {
        results.push({ id: bet.id, ok: true });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase
        .from("bets")
        .update({
          auto_settle_error: msg.slice(0, 500),
          last_auto_settle_at: new Date().toISOString(),
        })
        .eq("id", bet.id);
      results.push({ id: bet.id, ok: false, detail: msg });
    }
  }

  return new Response(
    JSON.stringify({
      processed: eligible.length,
      skipped_outside_window: bets.length - eligible.length,
      results,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});

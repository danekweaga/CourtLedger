import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";

const MARKET_DEFAULTS: Record<string, { base: number; vol: number }> = {
  points: { base: 21.5, vol: 6.2 },
  rebounds: { base: 6.8, vol: 3.4 },
  assists: { base: 4.8, vol: 3.1 },
  threes_made: { base: 2.4, vol: 1.7 },
  pra: { base: 33.5, vol: 8.5 },
  steals: { base: 1.2, vol: 0.9 },
  blocks: { base: 1.0, vol: 0.9 },
  turnovers: { base: 2.5, vol: 1.2 },
  total_points: { base: 222, vol: 11 },
  total: { base: 222, vol: 11 },
  spread: { base: 0, vol: 9 },
  moneyline: { base: 0.52, vol: 0.12 },
  player_prop: { base: 21.5, vol: 6.2 },
  team_prop: { base: 110, vol: 18 },
  game_prop: { base: 222, vol: 11 },
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function getMarketVolatility(marketType: string): number {
  const key = marketType.toLowerCase().replace(/\s+/g, "_");
  return MARKET_DEFAULTS[key]?.vol ?? MARKET_DEFAULTS.points.vol;
}

/**
 * Deterministic projection from manual inputs. Conservative; prefers line anchoring when data is thin.
 */
export function computeProjection(input: BetIntelligenceScenarioInput): number {
  const mt = input.market_type.toLowerCase().replace(/\s+/g, "_");
  const def = MARKET_DEFAULTS[mt] ?? MARKET_DEFAULTS.points;

  let projection = def.base;
  const form = `${input.recent_form ?? ""} ${input.notes ?? ""}`;

  const ppg = form.match(/(\d+\.?\d*)\s*(?:ppg|pts\/g|points\s*per)/i);
  const avg = form.match(/(?:avg|average)\s*[:\s-]*(\d+\.?\d*)/i);
  const l5 = form.match(/l\s*5[:\s]*(\d+\.?\d*)/i);

  if (ppg?.[1]) {
    const v = parseFloat(ppg[1]);
    if (Number.isFinite(v)) {
      projection = v * 0.96;
    }
  } else if (avg?.[1] && (mt.includes("point") || mt === "points" || mt === "pra")) {
    const v = parseFloat(avg[1]);
    if (Number.isFinite(v)) {
      projection = v * 0.95;
    }
  }

  if (l5?.[1] && (mt.includes("point") || mt === "points")) {
    const v = parseFloat(l5[1]);
    if (Number.isFinite(v)) {
      projection = round1(projection * 0.55 + v * 0.45);
    }
  }

  if (input.line > 0 && !ppg && !avg && !l5) {
    if (["points", "rebounds", "assists", "threes_made", "pra", "steals", "blocks", "turnovers", "player_prop"].includes(mt)) {
      projection = round1(input.line * 0.992 + def.base * 0.008);
    } else if (mt === "total_points" || mt === "total" || mt === "game_prop") {
      projection = round1(input.line * 0.998 + 110 * 0.002);
    } else if (mt === "spread" || mt === "team_prop") {
      projection = input.line;
    }
  }

  if (input.home_away === "home") {
    projection *= 1.015;
  }
  if (input.home_away === "away") {
    projection *= 0.985;
  }

  if (input.rest_days === 0) {
    projection *= 0.972;
  }
  if (input.rest_days === 1) {
    projection *= 0.99;
  }
  if (input.rest_days != null && input.rest_days >= 3) {
    projection *= 1.012;
  }

  if (input.opponent_pace_rank != null && input.opponent_pace_rank <= 7) {
    projection *= 1.022;
  }
  if (input.opponent_pace_rank != null && input.opponent_pace_rank >= 24) {
    projection *= 0.978;
  }

  const context = `${input.injury_context ?? ""} ${input.role_shift_notes ?? ""}`.toLowerCase();
  if (/(out|inactive|sidelined|doubtful|ruled\s*out)/.test(context) && /(teammate|secondary|creator|ball|handler|star)/.test(context)) {
    projection *= 1.032;
  }
  if (/minutes?\s*(limit|restriction|cap)/.test(context) || /bench\s*role/.test(context)) {
    projection *= 0.935;
  }

  if (mt === "moneyline") {
    return Math.min(0.62, Math.max(0.38, 0.5 + (input.line > 0 ? 0.02 : -0.02)));
  }

  return round1(projection);
}

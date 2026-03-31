import type { BetIntelligenceScenarioInput, IntelligenceReportResult } from "../types/betIntelligence";
import type { BetDraft, NBAMarketType } from "../types/bets";
import { createEmptyBetDraft } from "./betDraft";
import { computePotentialPayout } from "./profit";

const NBA_MARKET_VALUES: NBAMarketType[] = [
  "points",
  "rebounds",
  "assists",
  "threes_made",
  "pra",
  "steals",
  "blocks",
  "turnovers",
  "double_double",
  "triple_double",
  "moneyline",
  "spread",
  "total_points",
];

function normalizeMarketType(raw: string): NBAMarketType {
  if ((NBA_MARKET_VALUES as string[]).includes(raw)) {
    return raw as NBAMarketType;
  }
  return "points";
}

export type IntelligenceDraftSource = "top_picks" | "intelligence_analysis";

export function intelligenceScenarioToBetDraft(
  scenario: BetIntelligenceScenarioInput,
  options?: {
    source?: IntelligenceDraftSource;
    defaultStake?: number;
    report?: IntelligenceReportResult | null;
  },
): BetDraft {
  const source = options?.source ?? "intelligence_analysis";
  const stake = options?.defaultStake ?? 10;
  const odds = Number.isFinite(scenario.current_odds) ? scenario.current_odds : -110;
  const market = normalizeMarketType(scenario.market_type);
  const ou = scenario.over_under ?? "over";
  const today = new Date().toISOString().slice(0, 10);
  const matchup =
    scenario.team.trim() && scenario.opponent.trim()
      ? `${scenario.team.trim()} vs ${scenario.opponent.trim()}`
      : scenario.player_name.trim()
        ? `${scenario.player_name.trim()} — ${market.replaceAll("_", " ")}`
        : "";

  const sourceNote = source === "top_picks" ? "From Top Picks (slate scanner)." : "From Bet Intelligence analysis.";
  const reportNote = options?.report
    ? ` Verdict: ${options.report.final_verdict}, edge ${options.report.edge_score}/10. Pick: ${options.report.pick}.`
    : "";

  const base = createEmptyBetDraft();
  return {
    ...base,
    date_placed: today,
    game_date: today,
    matchup,
    sportsbook: base.sportsbook,
    player_name: scenario.player_name.trim(),
    team: scenario.team.trim(),
    opponent: scenario.opponent.trim(),
    bet_category: "player_prop",
    market_type: market,
    over_under: ou,
    line: scenario.line,
    odds,
    stake,
    potential_payout: computePotentialPayout(stake, odds),
    result_status: "pending",
    live_status: "not_started",
    current_stat_value: null,
    target_remaining: scenario.line,
    notes: `${sourceNote}${reportNote}`.trim(),
    auto_settle_enabled: true,
    stats_player_id: null,
    stats_game_id: null,
    last_auto_settle_at: null,
    auto_settle_error: null,
  };
}

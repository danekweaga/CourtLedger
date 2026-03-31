import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";

export function emptyIntelligenceScenario(): BetIntelligenceScenarioInput {
  return {
    player_name: "",
    team: "",
    opponent: "",
    market_type: "points",
    over_under: "over",
    line: 24.5,
    opening_line: null,
    current_odds: -110,
    notes: "",
    injury_context: "",
    recent_form: "",
    matchup_notes: "",
    home_away: undefined,
    rest_days: null,
    opponent_pace_rank: null,
    role_shift_notes: "",
  };
}

export function parseInputSnapshot(raw: unknown): BetIntelligenceScenarioInput {
  const base = emptyIntelligenceScenario();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const o = raw as Record<string, unknown>;
  return {
    ...base,
    player_name: typeof o.player_name === "string" ? o.player_name : base.player_name,
    team: typeof o.team === "string" ? o.team : base.team,
    opponent: typeof o.opponent === "string" ? o.opponent : base.opponent,
    market_type: typeof o.market_type === "string" ? o.market_type : base.market_type,
    over_under: o.over_under === "over" || o.over_under === "under" ? o.over_under : o.over_under === null ? null : base.over_under,
    line: typeof o.line === "number" ? o.line : Number(o.line) || base.line,
    opening_line: o.opening_line == null || o.opening_line === "" ? null : Number(o.opening_line),
    current_odds: typeof o.current_odds === "number" ? o.current_odds : Number(o.current_odds) || base.current_odds,
    notes: typeof o.notes === "string" ? o.notes : base.notes,
    injury_context: typeof o.injury_context === "string" ? o.injury_context : base.injury_context,
    recent_form: typeof o.recent_form === "string" ? o.recent_form : base.recent_form,
    matchup_notes: typeof o.matchup_notes === "string" ? o.matchup_notes : base.matchup_notes,
    home_away: o.home_away === "home" || o.home_away === "away" || o.home_away === "neutral" ? o.home_away : base.home_away,
    rest_days: o.rest_days == null ? base.rest_days : Number(o.rest_days),
    opponent_pace_rank: o.opponent_pace_rank == null ? base.opponent_pace_rank : Number(o.opponent_pace_rank),
    role_shift_notes: typeof o.role_shift_notes === "string" ? o.role_shift_notes : base.role_shift_notes,
  };
}

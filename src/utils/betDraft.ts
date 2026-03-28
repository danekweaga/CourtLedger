import type { BetDraft } from "../types/bets";
import { computePotentialPayout } from "./profit";

export function createEmptyBetDraft(): BetDraft {
  const today = new Date().toISOString().slice(0, 10);
  return {
    date_placed: today,
    game_date: today,
    matchup: "",
    sportsbook: "",
    player_name: "",
    team: "",
    opponent: "",
    bet_category: "player_prop",
    market_type: "points",
    over_under: "over",
    line: 0,
    odds: -110,
    stake: 10,
    potential_payout: computePotentialPayout(10, -110),
    result_status: "pending",
    live_status: "not_started",
    current_stat_value: null,
    target_remaining: null,
    notes: "",
    stream_url: "",
    stat_source_url: "",
    is_parlay_leg: false,
    bet_timing: "pregame",
    season: "2025-2026",
    season_type: "regular_season",
    is_free_bet: false,
    promo_toggle: false,
    cash_out_amount: null,
    units_staked: 1,
    game_status: "Scheduled",
    player_active_status: "Unknown",
  };
}

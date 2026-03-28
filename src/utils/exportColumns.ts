import type { Bet } from "../types/bets";
import { computeProfitForResult } from "./profit";

export const EXPORT_COLUMNS = [
  "date_placed",
  "game_date",
  "matchup",
  "player_name",
  "team",
  "opponent",
  "sportsbook",
  "market_type",
  "over_under",
  "line",
  "odds",
  "stake",
  "potential_payout",
  "result_status",
  "current_stat_value",
  "target_remaining",
  "net_profit_loss",
  "notes",
] as const;

export type ExportColumn = (typeof EXPORT_COLUMNS)[number];

export type ExportRow = Record<ExportColumn, string | number | null>;

export function toExportRow(bet: Bet): ExportRow {
  return {
    date_placed: bet.date_placed,
    game_date: bet.game_date,
    matchup: bet.matchup,
    player_name: bet.player_name,
    team: bet.team,
    opponent: bet.opponent,
    sportsbook: bet.sportsbook,
    market_type: bet.market_type,
    over_under: bet.over_under,
    line: bet.line,
    odds: bet.odds,
    stake: bet.stake,
    potential_payout: bet.potential_payout,
    result_status: bet.result_status,
    current_stat_value: bet.current_stat_value,
    target_remaining: bet.target_remaining,
    net_profit_loss: computeProfitForResult({
      stake: bet.stake,
      odds: bet.odds,
      resultStatus: bet.result_status,
      cashOutAmount: bet.cash_out_amount,
    }),
    notes: bet.notes,
  };
}

import type { BetCategory, NBAMarketType } from "../types/bets";

export const NBA_MARKETS: { value: NBAMarketType; label: string }[] = [
  { value: "points", label: "Points" },
  { value: "rebounds", label: "Rebounds" },
  { value: "assists", label: "Assists" },
  { value: "threes_made", label: "Threes Made" },
  { value: "pra", label: "PRA" },
  { value: "steals", label: "Steals" },
  { value: "blocks", label: "Blocks" },
  { value: "turnovers", label: "Turnovers" },
  { value: "double_double", label: "Double-Double" },
  { value: "triple_double", label: "Triple-Double" },
  { value: "moneyline", label: "Moneyline" },
  { value: "spread", label: "Spread" },
  { value: "total_points", label: "Total Points" },
];

export const BET_CATEGORIES: { value: BetCategory; label: string }[] = [
  { value: "player_prop", label: "Player Prop" },
  { value: "team_prop", label: "Team Prop" },
  { value: "game_prop", label: "Game Prop" },
  { value: "moneyline", label: "Moneyline" },
  { value: "spread", label: "Spread" },
  { value: "total", label: "Total" },
];

export const RESULT_STATUSES = ["pending", "win", "loss", "push", "void", "cash_out"] as const;
export const LIVE_STATUSES = ["not_started", "in_progress", "halftime", "finished"] as const;

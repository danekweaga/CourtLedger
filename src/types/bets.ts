export type BetResultStatus = "pending" | "win" | "loss" | "push" | "void" | "cash_out";
export type LiveStatus = "not_started" | "in_progress" | "halftime" | "finished";
export type OverUnder = "over" | "under";
export type BetTiming = "pregame" | "live";
export type SeasonType = "regular_season" | "playoffs";

export type BetCategory =
  | "player_prop"
  | "team_prop"
  | "game_prop"
  | "moneyline"
  | "spread"
  | "total";

export type NBAMarketType =
  | "points"
  | "rebounds"
  | "assists"
  | "threes_made"
  | "pra"
  | "steals"
  | "blocks"
  | "turnovers"
  | "double_double"
  | "triple_double"
  | "moneyline"
  | "spread"
  | "total_points";

export interface Bet {
  id: string;
  user_id: string;
  date_placed: string;
  game_date: string;
  matchup: string;
  sportsbook: string;
  player_name: string;
  team: string;
  opponent: string;
  bet_category: BetCategory;
  market_type: NBAMarketType;
  over_under: OverUnder | null;
  line: number | null;
  odds: number;
  stake: number;
  potential_payout: number;
  result_status: BetResultStatus;
  live_status: LiveStatus;
  current_stat_value: number | null;
  target_remaining: number | null;
  notes: string | null;
  stream_url: string | null;
  stat_source_url: string | null;
  is_parlay_leg: boolean;
  bet_timing: BetTiming;
  season: string | null;
  season_type: SeasonType | null;
  is_free_bet: boolean;
  promo_toggle: boolean;
  cash_out_amount: number | null;
  units_staked: number | null;
  game_status: string | null;
  player_active_status: string | null;
  /** When true, backend job grades this bet from NBA box scores (player props only). */
  auto_settle_enabled: boolean;
  /** balldontlie player id; speeds up sync and avoids ambiguous name search. */
  stats_player_id: number | null;
  /** Cached balldontlie game id after first successful resolution. */
  stats_game_id: number | null;
  last_auto_settle_at: string | null;
  auto_settle_error: string | null;
  created_at: string;
  updated_at: string;
}

export type BetDraft = Omit<Bet, "id" | "user_id" | "created_at" | "updated_at">;

export interface BetFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  player: string;
  team: string;
  opponent: string;
  sportsbook: string;
  marketType: string;
  resultStatus: string;
}

export type BetSortKey =
  | "newest"
  | "oldest"
  | "biggest_stake"
  | "biggest_profit"
  | "closest_to_hitting";

export interface LiveStatUpdate {
  betId: string;
  currentStatValue: number;
  liveStatus: LiveStatus;
  playerActiveStatus?: string;
  gameStatus?: string;
}

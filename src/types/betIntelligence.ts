export type IntelligenceConfidence = "Low" | "Medium" | "High";
export type IntelligenceDataQuality = "High" | "Medium" | "Low";
export type IntelligenceBestTime = "Now" | "Wait" | "Avoid";
export type IntelligenceVerdict = "Bet" | "Lean" | "Pass";
export type IntelligencePrediction = "HIT" | "MISS";

/** Manual scenario for analysis (MVP — no live APIs). */
export interface BetIntelligenceScenarioInput {
  player_name: string;
  team: string;
  opponent: string;
  market_type: string;
  over_under: "over" | "under" | null;
  line: number;
  opening_line: number | null;
  current_odds: number;
  notes?: string;
  injury_context?: string;
  recent_form?: string;
  matchup_notes?: string;
  home_away?: "home" | "away" | "neutral";
  rest_days?: number | null;
  opponent_pace_rank?: number | null;
  role_shift_notes?: string;
}

/** Structured report produced by the engine (and persisted). */
export interface IntelligenceReportResult {
  pick: string;
  prediction: IntelligencePrediction;
  line: number;
  projection: number;
  calibrated_hit_probability: number;
  confidence: IntelligenceConfidence;
  edge_score: number;
  main_reasons: string[];
  what_changed_today: string[];
  hidden_edge: string;
  trap_warning: boolean;
  trap_warning_reason: string;
  simulation_low: number;
  simulation_high: number;
  estimated_hit_frequency: number;
  risk_flags: string[];
  data_quality: IntelligenceDataQuality;
  best_time_to_bet: IntelligenceBestTime;
  final_verdict: IntelligenceVerdict;
}

/** Row shape for `bet_intelligence_reports` (Supabase). */
export interface BetIntelligenceReportRow {
  id: string;
  user_id: string;
  bet_id: string | null;
  pick_text: string;
  player_name: string;
  team: string;
  opponent: string;
  market_type: string;
  over_under: string | null;
  line: number;
  opening_line: number | null;
  current_odds: number;
  projection: number;
  hit_probability: number;
  confidence: string;
  edge_score: number;
  prediction: string;
  main_reasons: unknown;
  what_changed_today: unknown;
  hidden_edge: string;
  trap_warning: boolean;
  trap_warning_reason: string;
  simulation_low: number;
  simulation_high: number;
  estimated_hit_frequency: number;
  risk_flags: unknown;
  data_quality: string;
  best_time_to_bet: string;
  final_verdict: string;
  input_snapshot: unknown;
  created_at: string;
  updated_at: string;
}

export interface TopPickCardModel {
  pick: string;
  line: number;
  projection: number;
  hit_probability: number;
  confidence: IntelligenceConfidence;
  edge_score: number;
  why_it_hits: string[];
  what_changed_today: string[];
  hidden_edge: string;
  trap_warning: string;
  risk: string;
  best_time_to_bet: IntelligenceBestTime;
}

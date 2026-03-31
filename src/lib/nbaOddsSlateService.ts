import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";
import { supabase } from "./supabase";
import { parseInputSnapshot } from "../utils/intelligenceForm";

export interface NbaOddsSlateResponse {
  scenarios: BetIntelligenceScenarioInput[];
  count: number;
  odds_requests_remaining: string | null;
  odds_requests_used: string | null;
  disclaimer: string;
}

/**
 * One Edge Function call → one Odds API request (3 player markets × US) + sparse balldontlie lookups.
 * Requires deployed function `nba-odds-slate` and secrets THE_ODDS_API_KEY, BALLDONTLIE_API_KEY.
 */
export async function fetchNbaOddsSlateScenarios(): Promise<NbaOddsSlateResponse> {
  const { data, error } = await supabase.functions.invoke<NbaOddsSlateResponse>("nba-odds-slate", { body: {} });
  if (error) {
    throw new Error(error.message);
  }
  if (!data || typeof data !== "object") {
    throw new Error("Empty response from nba-odds-slate");
  }
  const raw = data as unknown as Record<string, unknown>;
  if (typeof raw.error === "string") {
    throw new Error(raw.error);
  }
  const scenariosIn = Array.isArray(raw.scenarios) ? raw.scenarios : [];
  const scenarios = scenariosIn.map((row) => parseInputSnapshot(row));
  return {
    scenarios,
    count: typeof raw.count === "number" ? raw.count : scenarios.length,
    odds_requests_remaining: typeof raw.odds_requests_remaining === "string" ? raw.odds_requests_remaining : null,
    odds_requests_used: typeof raw.odds_requests_used === "string" ? raw.odds_requests_used : null,
    disclaimer: typeof raw.disclaimer === "string" ? raw.disclaimer : "",
  };
}

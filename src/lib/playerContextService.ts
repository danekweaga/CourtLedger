import type { BetIntelligenceScenarioInput } from "../types/betIntelligence";
import { supabase } from "./supabase";

export interface PlayerContextResult {
  player_id: number;
  player_name: string;
  recent_form: string;
  matchup_notes: string;
}

type ApiPayload = {
  ok?: boolean;
  player_id?: number;
  player_name?: string;
  recent_form?: string;
  matchup_notes?: string;
  error?: string;
  hint?: string;
};

export async function fetchPlayerContext(
  playerName: string,
  marketType: string,
): Promise<Partial<BetIntelligenceScenarioInput>> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.access_token) {
    throw new Error("You must be signed in to enrich from stats API.");
  }

  const response = await fetch("/api/player-context", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ player_name: playerName, market_type: marketType }),
  });

  const payload = (await response.json()) as ApiPayload;
  if (!response.ok || !payload.ok) {
    const detail = [payload.error, payload.hint].filter(Boolean).join(" · ");
    throw new Error(detail || `Failed to load player context (HTTP ${response.status}).`);
  }

  return {
    recent_form: payload.recent_form ?? "",
    matchup_notes: payload.matchup_notes ?? "",
  };
}

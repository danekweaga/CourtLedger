import { supabase } from "./supabase";
import type { Bet, LiveStatUpdate } from "../types/bets";
import { calculateTargetRemaining } from "../utils/progress";

const LIVE_STATS_TABLE = "live_stats_cache";
const BETS_TABLE = "bets";

export async function upsertLiveStat(userId: string, update: LiveStatUpdate) {
  const { error } = await supabase.from(LIVE_STATS_TABLE).upsert(
    {
      user_id: userId,
      bet_id: update.betId,
      current_stat_value: update.currentStatValue,
      live_status: update.liveStatus,
      game_status: update.gameStatus ?? null,
      player_active_status: update.playerActiveStatus ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "bet_id,user_id" },
  );
  if (error) {
    throw error;
  }
}

export async function updateBetLiveTracking(id: string, update: LiveStatUpdate): Promise<Bet> {
  const { data: current, error: getError } = await supabase.from(BETS_TABLE).select("*").eq("id", id).single();
  if (getError) {
    throw getError;
  }

  const currentBet = current as Bet;
  const targetRemaining = calculateTargetRemaining(currentBet.line, update.currentStatValue, currentBet.over_under);
  const { data, error } = await supabase
    .from(BETS_TABLE)
    .update({
      current_stat_value: update.currentStatValue,
      live_status: update.liveStatus,
      game_status: update.gameStatus ?? currentBet.game_status,
      player_active_status: update.playerActiveStatus ?? currentBet.player_active_status,
      target_remaining: targetRemaining,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data as Bet;
}

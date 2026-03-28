import { supabase } from "./supabase";
import type { Bet, BetDraft, BetResultStatus } from "../types/bets";
import { computePotentialPayout, computeProfitForResult } from "../utils/profit";
import { gradeBetByManualResult } from "../utils/grading";

const BETS_TABLE = "bets";

function withComputedFields(draft: BetDraft): BetDraft {
  const payout = computePotentialPayout(draft.stake, draft.odds);
  const resultStatus = draft.result_status;
  const profit = computeProfitForResult({
    stake: draft.stake,
    odds: draft.odds,
    resultStatus,
    cashOutAmount: draft.cash_out_amount,
  });
  return {
    ...draft,
    potential_payout: payout,
    notes: draft.notes ?? (profit !== 0 ? `Net: ${profit.toFixed(2)}` : draft.notes),
  };
}

export async function fetchBets(userId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from(BETS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("date_placed", { ascending: false });

  if (error) {
    throw error;
  }
  return (data ?? []) as Bet[];
}

export async function createBet(userId: string, draft: BetDraft): Promise<Bet> {
  const payload = withComputedFields(draft);
  const { data, error } = await supabase
    .from(BETS_TABLE)
    .insert([{ ...payload, user_id: userId }])
    .select("*")
    .single();
  if (error) {
    throw error;
  }
  return data as Bet;
}

export async function updateBet(id: string, patch: Partial<BetDraft>): Promise<Bet> {
  const { data: current, error: getError } = await supabase
    .from(BETS_TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (getError) {
    throw getError;
  }

  const merged = withComputedFields({ ...(current as BetDraft), ...patch });
  const { data, error } = await supabase.from(BETS_TABLE).update(merged).eq("id", id).select("*").single();

  if (error) {
    throw error;
  }
  return data as Bet;
}

export async function deleteBet(id: string) {
  const { error } = await supabase.from(BETS_TABLE).delete().eq("id", id);
  if (error) {
    throw error;
  }
}

export async function duplicateBet(userId: string, bet: Bet): Promise<Bet> {
  const copyDraft: BetDraft = {
    ...bet,
    date_placed: new Date().toISOString().slice(0, 10),
    result_status: "pending",
    live_status: "not_started",
    current_stat_value: null,
    target_remaining: bet.line ?? null,
    notes: bet.notes ? `${bet.notes} (Duplicated)` : "Duplicated bet",
    game_status: "Scheduled",
    player_active_status: "Unknown",
  };
  return createBet(userId, copyDraft);
}

export async function quickGradeBet(id: string, resultStatus: Exclude<BetResultStatus, "pending">): Promise<Bet> {
  const { data: current, error: getError } = await supabase
    .from(BETS_TABLE)
    .select("*")
    .eq("id", id)
    .single();
  if (getError) {
    throw getError;
  }

  const graded = gradeBetByManualResult(current as Bet, resultStatus);
  const { data, error } = await supabase.from(BETS_TABLE).update(graded).eq("id", id).select("*").single();
  if (error) {
    throw error;
  }
  return data as Bet;
}

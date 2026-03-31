import { supabase } from "./supabase";
import type { Bet, BetDraft, BetResultStatus } from "../types/bets";
import { computePotentialPayout, computeProfitForResult } from "../utils/profit";
import { gradeBetByManualResult } from "../utils/grading";

const BETS_TABLE = "bets";
const MAX_COLUMN_PRUNE_RETRIES = 12;

export function normalizeBetRow(row: Bet): Bet {
  return {
    ...row,
    auto_settle_enabled: row.auto_settle_enabled ?? false,
    stats_player_id: row.stats_player_id ?? null,
    stats_game_id: row.stats_game_id ?? null,
    last_auto_settle_at: row.last_auto_settle_at ?? null,
    auto_settle_error: row.auto_settle_error ?? null,
  };
}

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

function extractMissingColumn(error: unknown): string | null {
  const message = (error as { message?: string } | null)?.message ?? "";
  const schemaCacheMatch = message.match(/Could not find the '([^']+)' column/i);
  if (schemaCacheMatch?.[1]) {
    return schemaCacheMatch[1];
  }
  const relationMatch = message.match(/column "?([a-zA-Z0-9_]+)"? of relation/i);
  if (relationMatch?.[1]) {
    return relationMatch[1];
  }
  return null;
}

async function insertBetWithColumnPruning(payload: Record<string, unknown>): Promise<Bet> {
  const candidate = { ...payload };
  for (let attempt = 0; attempt < MAX_COLUMN_PRUNE_RETRIES; attempt += 1) {
    const { data, error } = await supabase.from(BETS_TABLE).insert([candidate]).select("*").single();
    if (!error) {
      return normalizeBetRow(data as Bet);
    }

    const missingColumn = extractMissingColumn(error);
    if (!missingColumn || !(missingColumn in candidate)) {
      throw error;
    }
    delete candidate[missingColumn];
  }
  throw new Error("Insert failed after pruning unsupported columns from bets payload.");
}

async function updateBetWithColumnPruning(id: string, payload: Record<string, unknown>): Promise<Bet> {
  const candidate = { ...payload };
  for (let attempt = 0; attempt < MAX_COLUMN_PRUNE_RETRIES; attempt += 1) {
    const { data, error } = await supabase.from(BETS_TABLE).update(candidate).eq("id", id).select("*").single();
    if (!error) {
      return normalizeBetRow(data as Bet);
    }

    const missingColumn = extractMissingColumn(error);
    if (!missingColumn || !(missingColumn in candidate)) {
      throw error;
    }
    delete candidate[missingColumn];
  }
  throw new Error("Update failed after pruning unsupported columns from bets payload.");
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
  return ((data ?? []) as Bet[]).map(normalizeBetRow);
}

export async function createBet(userId: string, draft: BetDraft): Promise<Bet> {
  const payload = withComputedFields(draft);
  return insertBetWithColumnPruning({ ...payload, user_id: userId });
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
  return updateBetWithColumnPruning(id, merged as unknown as Record<string, unknown>);
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
    stats_game_id: null,
    last_auto_settle_at: null,
    auto_settle_error: null,
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
  return normalizeBetRow(data as Bet);
}

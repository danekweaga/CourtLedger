import type { Bet, BetResultStatus } from "../types/bets";
import { computeProfitForResult } from "./profit";

export function gradeBetByManualResult(bet: Bet, resultStatus: Exclude<BetResultStatus, "pending">): Partial<Bet> {
  const netProfit = computeProfitForResult({
    stake: bet.stake,
    odds: bet.odds,
    resultStatus,
    cashOutAmount: bet.cash_out_amount,
  });

  return {
    result_status: resultStatus,
    live_status: bet.live_status === "finished" ? "finished" : bet.live_status,
    notes: `${bet.notes ?? ""} ${`Net ${netProfit >= 0 ? "+" : ""}${netProfit.toFixed(2)}`}`.trim(),
  };
}

export function getHitStateLabel(bet: Bet): string {
  if (bet.result_status === "win") {
    return "Hit";
  }
  if (bet.result_status === "loss") {
    return "Missed";
  }
  if (bet.live_status === "finished") {
    return "Finished";
  }
  if (bet.target_remaining === null) {
    return "On pace";
  }
  if (bet.target_remaining <= 0) {
    return "Hit";
  }
  if (bet.target_remaining <= 1.5) {
    return "Very close";
  }
  if (bet.target_remaining <= 3) {
    return `Needs ${bet.target_remaining.toFixed(1)} more`;
  }
  return "Behind pace";
}

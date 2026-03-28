import type { BetResultStatus } from "../types/bets";
import { americanOddsToDecimal } from "./odds";

interface ProfitInput {
  stake: number;
  odds: number;
  resultStatus: BetResultStatus;
  cashOutAmount?: number | null;
}

export function computePotentialPayout(stake: number, odds: number): number {
  const decimal = americanOddsToDecimal(odds);
  return Number((stake * decimal).toFixed(2));
}

export function computeProfitForResult(input: ProfitInput): number {
  const { stake, odds, resultStatus, cashOutAmount } = input;
  switch (resultStatus) {
    case "win":
      return Number((computePotentialPayout(stake, odds) - stake).toFixed(2));
    case "loss":
      return Number((-stake).toFixed(2));
    case "push":
    case "void":
      return 0;
    case "cash_out":
      return Number(((cashOutAmount ?? 0) - stake).toFixed(2));
    case "pending":
    default:
      return 0;
  }
}

export function computeRoi(totalProfit: number, totalStaked: number): number {
  if (totalStaked === 0) {
    return 0;
  }
  return Number(((totalProfit / totalStaked) * 100).toFixed(2));
}

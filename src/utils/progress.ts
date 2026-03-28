import type { OverUnder } from "../types/bets";

export function calculateProgressPercentage(
  line: number | null,
  currentStatValue: number | null,
  overUnder: OverUnder | null,
): number {
  if (line === null || currentStatValue === null || line <= 0) {
    return 0;
  }
  if (overUnder === "under") {
    const remaining = Math.max(line - currentStatValue, 0);
    return Number((Math.min((remaining / line) * 100, 100)).toFixed(1));
  }
  return Number((Math.min((currentStatValue / line) * 100, 100)).toFixed(1));
}

export function calculateTargetRemaining(
  line: number | null,
  currentStatValue: number | null,
  overUnder: OverUnder | null,
): number | null {
  if (line === null || currentStatValue === null) {
    return null;
  }
  if (overUnder === "under") {
    return Number((currentStatValue - line).toFixed(2));
  }
  return Number((line - currentStatValue).toFixed(2));
}

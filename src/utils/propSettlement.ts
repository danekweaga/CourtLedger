import type { NBAMarketType, OverUnder } from "../types/bets";

const SUPPORTED_MARKETS: NBAMarketType[] = [
  "points",
  "rebounds",
  "assists",
  "threes_made",
  "pra",
  "steals",
  "blocks",
  "turnovers",
];

export function isAutoSettleMarketType(marketType: string): marketType is NBAMarketType {
  return (SUPPORTED_MARKETS as string[]).includes(marketType);
}

/** Final box-score value for the bet's market (PRA = pts+reb+ast). */
export function finalStatFromBoxRow(marketType: string, row: Record<string, unknown>): number | null {
  const num = (k: string) => {
    const v = row[k];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  };
  switch (marketType) {
    case "points":
      return num("pts");
    case "rebounds":
      return num("reb");
    case "assists":
      return num("ast");
    case "threes_made":
      return num("fg3m");
    case "steals":
      return num("stl");
    case "blocks":
      return num("blk");
    case "turnovers":
      return num("turnover");
    case "pra": {
      const p = num("pts");
      const r = num("reb");
      const a = num("ast");
      if (p == null || r == null || a == null) {
        return null;
      }
      return p + r + a;
    }
    default:
      return null;
  }
}

/**
 * Simple numeric O/U grading (integer or half lines). Push when stat equals line (within epsilon).
 */
export function settlePlayerPropFromFinalStat(
  marketType: string,
  line: number | null,
  overUnder: OverUnder | null,
  finalStat: number,
): "win" | "loss" | "push" | null {
  if (line == null || overUnder == null) {
    return null;
  }
  if (!isAutoSettleMarketType(marketType)) {
    return null;
  }

  const eps = 1e-6;
  if (overUnder === "over") {
    if (finalStat > line + eps) {
      return "win";
    }
    if (finalStat < line - eps) {
      return "loss";
    }
    return "push";
  }
  if (finalStat < line - eps) {
    return "win";
  }
  if (finalStat > line + eps) {
    return "loss";
  }
  return "push";
}

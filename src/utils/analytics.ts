import type { Bet } from "../types/bets";
import type { SeriesPoint, SummaryStats, TimeSeriesPoint } from "../types/analytics";
import { computeProfitForResult, computeRoi } from "./profit";

export interface BreakdownEntry {
  name: string;
  profit: number;
  wins: number;
  losses: number;
  total: number;
}

function toBreakdownMap(bets: Bet[], key: (bet: Bet) => string) {
  const map = new Map<string, BreakdownEntry>();
  for (const bet of bets) {
    const name = key(bet) || "Unknown";
    const profit = computeProfitForResult({
      stake: bet.stake,
      odds: bet.odds,
      resultStatus: bet.result_status,
      cashOutAmount: bet.cash_out_amount,
    });
    const existing = map.get(name);
    if (existing) {
      existing.profit += profit;
      existing.total += 1;
      if (bet.result_status === "win") {
        existing.wins += 1;
      }
      if (bet.result_status === "loss") {
        existing.losses += 1;
      }
    } else {
      map.set(name, {
        name,
        profit,
        total: 1,
        wins: bet.result_status === "win" ? 1 : 0,
        losses: bet.result_status === "loss" ? 1 : 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.profit - a.profit);
}

export function computeSummaryStats(bets: Bet[]): SummaryStats {
  const wins = bets.filter((bet) => bet.result_status === "win").length;
  const losses = bets.filter((bet) => bet.result_status === "loss").length;
  const pushes = bets.filter((bet) => bet.result_status === "push").length;
  const voids = bets.filter((bet) => bet.result_status === "void").length;
  const cashOuts = bets.filter((bet) => bet.result_status === "cash_out").length;
  const settled = wins + losses + pushes + voids + cashOuts;
  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalUnits = bets.reduce((sum, bet) => sum + (bet.units_staked ?? 0), 0);
  const totalProfit = bets.reduce((sum, bet) => {
    return (
      sum +
      computeProfitForResult({
        stake: bet.stake,
        odds: bet.odds,
        resultStatus: bet.result_status,
        cashOutAmount: bet.cash_out_amount,
      })
    );
  }, 0);

  const unitProfit =
    totalUnits === 0 ? 0 : Number((totalProfit / (totalStaked / Math.max(totalUnits, 1))).toFixed(2));
  const averageStake = bets.length ? Number((totalStaked / bets.length).toFixed(2)) : 0;
  const averageOdds = bets.length ? Number((bets.reduce((sum, bet) => sum + bet.odds, 0) / bets.length).toFixed(0)) : 0;

  return {
    totalBets: bets.length,
    wins,
    losses,
    pushes,
    voids,
    cashOuts,
    winRate: settled ? Number(((wins / settled) * 100).toFixed(2)) : 0,
    roi: computeRoi(totalProfit, totalStaked),
    totalStaked: Number(totalStaked.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    averageStake,
    averageOdds,
    totalUnits: Number(totalUnits.toFixed(2)),
    unitProfit,
  };
}

export function profitOverTime(bets: Bet[]): TimeSeriesPoint[] {
  const sorted = [...bets].sort((a, b) => a.game_date.localeCompare(b.game_date));
  let cumulative = 0;
  return sorted.map((bet) => {
    cumulative += computeProfitForResult({
      stake: bet.stake,
      odds: bet.odds,
      resultStatus: bet.result_status,
      cashOutAmount: bet.cash_out_amount,
    });
    return {
      date: bet.game_date,
      cumulativeProfit: Number(cumulative.toFixed(2)),
    };
  });
}

export function profitByMarketType(bets: Bet[]): SeriesPoint[] {
  return toBreakdownMap(bets, (bet) => bet.market_type).map((entry) => ({
    label: entry.name,
    value: Number(entry.profit.toFixed(2)),
  }));
}

export function profitBySportsbook(bets: Bet[]): SeriesPoint[] {
  return toBreakdownMap(bets, (bet) => bet.sportsbook).map((entry) => ({
    label: entry.name,
    value: Number(entry.profit.toFixed(2)),
  }));
}

export function bestAndWorstPlayer(bets: Bet[]) {
  const entries = toBreakdownMap(bets, (bet) => bet.player_name);
  return {
    bestPlayer: entries[0]?.name ?? "N/A",
    worstPlayer: entries.at(-1)?.name ?? "N/A",
  };
}

export function bestBetCategory(bets: Bet[]) {
  const entry = toBreakdownMap(bets, (bet) => bet.bet_category)[0];
  return entry?.name ?? "N/A";
}

export function recordBySportsbook(bets: Bet[]): BreakdownEntry[] {
  return toBreakdownMap(bets, (bet) => bet.sportsbook);
}

export function recordByMarketType(bets: Bet[]): BreakdownEntry[] {
  return toBreakdownMap(bets, (bet) => bet.market_type);
}

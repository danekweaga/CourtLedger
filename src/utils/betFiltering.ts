import type { Bet, BetFilters, BetSortKey } from "../types/bets";
import { computeProfitForResult } from "./profit";

export function applyFiltersAndSort(bets: Bet[], filters: BetFilters, sort: BetSortKey): Bet[] {
  const search = filters.search.toLowerCase().trim();
  const filtered = bets.filter((bet) => {
    if (filters.dateFrom && bet.game_date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && bet.game_date > filters.dateTo) {
      return false;
    }
    if (filters.player && !bet.player_name.toLowerCase().includes(filters.player.toLowerCase())) {
      return false;
    }
    if (filters.team && !bet.team.toLowerCase().includes(filters.team.toLowerCase())) {
      return false;
    }
    if (filters.opponent && !bet.opponent.toLowerCase().includes(filters.opponent.toLowerCase())) {
      return false;
    }
    if (filters.sportsbook && !bet.sportsbook.toLowerCase().includes(filters.sportsbook.toLowerCase())) {
      return false;
    }
    if (filters.marketType && !bet.market_type.toLowerCase().includes(filters.marketType.toLowerCase())) {
      return false;
    }
    if (filters.resultStatus && bet.result_status !== filters.resultStatus) {
      return false;
    }
    if (
      search &&
      !`${bet.player_name} ${bet.matchup} ${bet.notes ?? ""}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case "oldest":
        return a.date_placed.localeCompare(b.date_placed);
      case "biggest_stake":
        return b.stake - a.stake;
      case "biggest_profit": {
        const profitA = computeProfitForResult({
          stake: a.stake,
          odds: a.odds,
          resultStatus: a.result_status,
          cashOutAmount: a.cash_out_amount,
        });
        const profitB = computeProfitForResult({
          stake: b.stake,
          odds: b.odds,
          resultStatus: b.result_status,
          cashOutAmount: b.cash_out_amount,
        });
        return profitB - profitA;
      }
      case "closest_to_hitting":
        return Math.abs(a.target_remaining ?? 100) - Math.abs(b.target_remaining ?? 100);
      case "newest":
      default:
        return b.date_placed.localeCompare(a.date_placed);
    }
  });

  return sorted;
}

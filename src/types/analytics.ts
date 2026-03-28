export interface SummaryStats {
  totalBets: number;
  wins: number;
  losses: number;
  pushes: number;
  voids: number;
  cashOuts: number;
  winRate: number;
  roi: number;
  totalStaked: number;
  totalProfit: number;
  averageStake: number;
  averageOdds: number;
  totalUnits: number;
  unitProfit: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface TimeSeriesPoint {
  date: string;
  cumulativeProfit: number;
}

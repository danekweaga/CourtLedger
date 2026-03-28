export function americanOddsToDecimal(odds: number): number {
  if (odds === 0) {
    return 1;
  }
  if (odds > 0) {
    return odds / 100 + 1;
  }
  return 100 / Math.abs(odds) + 1;
}

export function impliedProbabilityFromAmerican(odds: number): number {
  if (odds === 0) {
    return 0;
  }
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

export function formatAmericanOdds(odds: number): string {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

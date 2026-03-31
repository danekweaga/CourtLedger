const MONEY_SAVED_FROM_BETTING_KEY = "courtledger.moneySavedFromBetting";

export function readMoneySavedFromBetting(): number {
  const raw = localStorage.getItem(MONEY_SAVED_FROM_BETTING_KEY);
  if (raw == null || raw === "") {
    return 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

export function writeMoneySavedFromBetting(value: number): void {
  const n = Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  localStorage.setItem(MONEY_SAVED_FROM_BETTING_KEY, String(n));
}

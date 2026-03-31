import type { BetCategory, BetDraft, NBAMarketType, OverUnder } from "../types/bets";

const SPORTSBOOK_ALIASES: { pattern: RegExp; value: string }[] = [
  { pattern: /\bdraft\s*kings?\b/i, value: "DraftKings" },
  { pattern: /\bfan\s*duel\b/i, value: "FanDuel" },
  { pattern: /\bbet\s*mgm\b/i, value: "BetMGM" },
  { pattern: /\bcaesars?\b/i, value: "Caesars" },
  { pattern: /\bpoints\s*bet\b/i, value: "PointsBet" },
  { pattern: /\bbarstool\b/i, value: "Barstool" },
  { pattern: /\bwynn\b/i, value: "WynnBET" },
  { pattern: /\bbet\s*rivers?\b/i, value: "BetRivers" },
  { pattern: /\bfanatics\b/i, value: "Fanatics" },
  { pattern: /\bespn\s*bet\b/i, value: "ESPN BET" },
  { pattern: /\bprize\s*picks?\b/i, value: "PrizePicks" },
  { pattern: /\bunderdog\b/i, value: "Underdog" },
];

const MARKET_KEYWORDS: { pattern: RegExp; market_type: NBAMarketType; bet_category?: BetCategory }[] = [
  { pattern: /\bpra\b|\bpoints?\s*\+\s*rebs?\s*\+\s*asts?\b/i, market_type: "pra", bet_category: "player_prop" },
  { pattern: /\bpoints?\b|\bpts\b/i, market_type: "points", bet_category: "player_prop" },
  { pattern: /\brebounds?\b|\brebs?\b/i, market_type: "rebounds", bet_category: "player_prop" },
  { pattern: /\bassists?\b|\basts?\b/i, market_type: "assists", bet_category: "player_prop" },
  { pattern: /\b3[\s-]?pt\b|\bthrees?\b|\bthree[\s-]?pointers?\b/i, market_type: "threes_made", bet_category: "player_prop" },
  { pattern: /\bsteals?\b/i, market_type: "steals", bet_category: "player_prop" },
  { pattern: /\bblocks?\b/i, market_type: "blocks", bet_category: "player_prop" },
  { pattern: /\bturnovers?\b|\btos?\b/i, market_type: "turnovers", bet_category: "player_prop" },
  { pattern: /\bmoney\s*line\b|\bml\b/i, market_type: "moneyline", bet_category: "moneyline" },
  { pattern: /\bspread\b|\bats?\b(?!\s*\d)/i, market_type: "spread", bet_category: "spread" },
  { pattern: /\btotal\b|\bo\/u\b|\bover\/under\b/i, market_type: "total_points", bet_category: "total" },
];

function normalizeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findAmericanOdds(text: string): number | undefined {
  const matches = text.matchAll(/(?<![\d.+-])[+-](?:1[0-9]{2}|[2-9]\d{2}|\d{4,})(?![\d.])/g);
  const candidates: number[] = [];
  for (const m of matches) {
    const n = Number(m[0]);
    if (!Number.isNaN(n) && Math.abs(n) >= 100 && Math.abs(n) <= 10000) {
      candidates.push(n);
    }
  }
  if (candidates.length === 0) {
    return undefined;
  }
  const lower = text.toLowerCase();
  const riskIdx = lower.search(/\b(risk|wager|stake|bet amount)\b/);
  if (riskIdx >= 0) {
    const slice = text.slice(riskIdx, riskIdx + 120);
    const near = slice.match(/[+-](?:1[0-9]{2}|[2-9]\d{2}|\d{4,})/);
    if (near) {
      return Number(near[0]);
    }
  }
  return candidates[candidates.length - 1];
}

function findStake(text: string): number | undefined {
  const lower = text.toLowerCase();
  const patterns: RegExp[] = [
    /\b(?:risk|wager|stake)\s*[:\s]?\s*\$?\s*(\d+(?:\.\d{1,2})?)/i,
    /\$\s*(\d+(?:\.\d{1,2})?)\s*(?:risk|wager|stake)?/i,
    /\bto\s+win\s+\$?\s*(\d+(?:\.\d{1,2})?)/i,
  ];
  for (const re of patterns) {
    const m = lower.match(re) ?? text.match(re);
    if (m?.[1]) {
      const v = Number(m[1]);
      if (!Number.isNaN(v) && v > 0 && v < 1_000_000) {
        return v;
      }
    }
  }
  const dollarMatches = [...text.matchAll(/\$\s*(\d+(?:\.\d{1,2})?)/g)];
  if (dollarMatches.length > 0) {
    const amounts = dollarMatches.map((x) => Number(x[1])).filter((n) => !Number.isNaN(n) && n > 0 && n < 1_000_000);
    if (amounts.length > 0) {
      return Math.min(...amounts);
    }
  }
  return undefined;
}

function findLine(text: string): number | undefined {
  const ou = text.match(/\b(?:o|u|over|under)\s*([0-9]+(?:\.5)?)\b/i);
  if (ou?.[1]) {
    return Number(ou[1]);
  }
  const dec = text.match(/\b([0-9]+(?:\.5)?)\s*(?:pts?|rebs?|asts?|points?)\b/i);
  if (dec?.[1]) {
    return Number(dec[1]);
  }
  const lone = text.match(/\b([0-9]{1,2}\.[05])\b/g);
  if (lone) {
    for (const token of lone) {
      const n = Number(token);
      if (n >= 0.5 && n <= 99.5) {
        return n;
      }
    }
  }
  return undefined;
}

function findOverUnder(text: string): OverUnder | undefined {
  if (/\bover\b/i.test(text) && !/\bunder\b/i.test(text)) {
    return "over";
  }
  if (/\bunder\b/i.test(text) && !/\bover\b/i.test(text)) {
    return "under";
  }
  if (/\bo\/u\b/i.test(text) || /\bover\s*\/\s*under\b/i.test(text)) {
    return undefined;
  }
  return undefined;
}

function findSportsbook(text: string): string | undefined {
  for (const { pattern, value } of SPORTSBOOK_ALIASES) {
    if (pattern.test(text)) {
      return value;
    }
  }
  return undefined;
}

function findMatchupLine(lines: string[]): string | undefined {
  for (const line of lines) {
    if (/\bvs\.?\b|\b@\b|\bv\.?\b/i.test(line) && line.length < 120) {
      return line.replace(/\s+/g, " ").trim();
    }
  }
  return undefined;
}

function inferMarket(text: string): Pick<BetDraft, "market_type" | "bet_category"> | undefined {
  for (const { pattern, market_type, bet_category } of MARKET_KEYWORDS) {
    if (pattern.test(text)) {
      return { market_type, bet_category: bet_category ?? "player_prop" };
    }
  }
  return undefined;
}

/**
 * Best-effort mapping from OCR text to bet fields. User should always review before saving.
 */
export function parseBetSlipText(raw: string): Partial<BetDraft> {
  const text = raw.replace(/\u00a0/g, " ").trim();
  if (!text) {
    return {};
  }
  const lines = normalizeLines(text);
  const joined = lines.join("\n");
  const patch: Partial<BetDraft> = {};

  const odds = findAmericanOdds(joined);
  if (odds !== undefined) {
    patch.odds = odds;
  }
  const stake = findStake(joined);
  if (stake !== undefined) {
    patch.stake = stake;
  }
  const line = findLine(joined);
  if (line !== undefined) {
    patch.line = line;
  }
  const ou = findOverUnder(joined);
  if (ou !== undefined) {
    patch.over_under = ou;
  }
  const book = findSportsbook(joined);
  if (book) {
    patch.sportsbook = book;
  }
  const matchup = findMatchupLine(lines);
  if (matchup) {
    patch.matchup = matchup;
  }
  const market = inferMarket(joined);
  if (market) {
    patch.market_type = market.market_type;
    patch.bet_category = market.bet_category;
  }

  const playerGuess = lines.find((l) => /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(l) && l.length < 60 && !SPORTSBOOK_ALIASES.some((s) => s.pattern.test(l)));
  if (playerGuess && !patch.matchup?.includes(playerGuess)) {
    patch.player_name = playerGuess;
  }

  return patch;
}

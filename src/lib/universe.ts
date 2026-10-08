import raw from "@/data/universe.json";

export interface Security {
  /** Ticker symbol. */
  t: string;
  /** Company name. */
  n: string;
  /** Listing exchange. */
  x: string;
  /** 1 when the security is an ETF. */
  e: 0 | 1;
}

export const UNIVERSE = raw as Security[];

const byTicker = new Map(UNIVERSE.map((s) => [s.t, s]));

export function getSecurity(ticker: string): Security | undefined {
  return byTicker.get(ticker.toUpperCase());
}

export function securityExists(ticker: string) {
  return byTicker.has(ticker.toUpperCase());
}

/**
 * Ranked symbol/name search over the whole universe. Exact ticker first, then
 * ticker prefix, then name prefix, then substring — so typing "AA" surfaces AA
 * and AAPL before some fund with "aa" buried in its name. Plain stocks outrank
 * ETFs at equal score, since a search for "APPLE" wants the company.
 */
export function searchUniverse(query: string, limit = 25): Security[] {
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const scored: { s: Security; score: number }[] = [];

  for (const s of UNIVERSE) {
    const ticker = s.t;
    const name = s.n.toUpperCase();
    let score = 0;

    if (ticker === q) score = 1000;
    else if (ticker.startsWith(q)) score = 700 - ticker.length;
    else if (name.startsWith(q)) score = 500 - name.length / 40;
    else if (name.includes(` ${q}`)) score = 300 - name.length / 40;
    else if (ticker.includes(q)) score = 200 - ticker.length;
    else if (name.includes(q)) score = 100 - name.length / 40;
    else continue;

    if (s.e) score -= 40;
    scored.push({ s, score });
    // Early exit: an exact hit plus a healthy candidate pool is enough.
    if (scored.length > 4000) break;
  }

  return scored
    .sort((a, b) => b.score - a.score || a.s.t.localeCompare(b.s.t))
    .slice(0, limit)
    .map((r) => r.s);
}

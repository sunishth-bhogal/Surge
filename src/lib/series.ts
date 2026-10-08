import { QUOTES } from "@/data/stocks";
import { deriveQuote } from "@/lib/quote-engine";
import type { PricePoint, Range, Series } from "@/lib/types";

/**
 * Charts are generated, not stored — but they must be identical on the server
 * and the client or React will flag a hydration mismatch, so every walk is
 * seeded off the ticker and range rather than Math.random.
 */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Percent return over each window, per ticker — shapes the long-range charts. */
const RETURNS: Record<string, Record<Exclude<Range, "1D">, number>> = {
  NVDA: { "1W": 7.2, "1M": 14.6, "3M": 21.4, "1Y": 82.3, "5Y": 1180 },
  TSLA: { "1W": -4.8, "1M": 6.2, "3M": 31.5, "1Y": 42.6, "5Y": 190 },
  AAPL: { "1W": 2.1, "1M": 5.4, "3M": 12.8, "1Y": 9.4, "5Y": 118 },
  MSFT: { "1W": 1.4, "1M": 3.2, "3M": -2.4, "1Y": 18.6, "5Y": 148 },
  META: { "1W": -3.2, "1M": 4.1, "3M": 9.8, "1Y": 26.4, "5Y": 180 },
  AMD: { "1W": 9.4, "1M": 18.2, "3M": 34.6, "1Y": 48.2, "5Y": 96 },
  PLTR: { "1W": 6.8, "1M": 11.4, "3M": 41.2, "1Y": 158, "5Y": 720 },
  AMZN: { "1W": 2.6, "1M": 4.8, "3M": 8.2, "1Y": 22.1, "5Y": 86 },
  GOOGL: { "1W": 3.4, "1M": 9.1, "3M": 24.6, "1Y": 54.8, "5Y": 212 },
};

const SHAPE: Record<Range, { points: number; vol: number; spanMs: number }> = {
  "1D": { points: 79, vol: 0.0032, spanMs: 6.5 * 3600_000 },
  "1W": { points: 40, vol: 0.006, spanMs: 5 * 86400_000 },
  "1M": { points: 44, vol: 0.011, spanMs: 30 * 86400_000 },
  "3M": { points: 64, vol: 0.019, spanMs: 91 * 86400_000 },
  "1Y": { points: 72, vol: 0.034, spanMs: 365 * 86400_000 },
  "5Y": { points: 84, vol: 0.062, spanMs: 5 * 365 * 86400_000 },
};

/** Fixed clock so generated timestamps don't drift between renders. */
const SESSION_CLOSE = Date.UTC(2026, 9, 7, 20, 0, 0);

export function buildSeries(ticker: string, range: Range): Series {
  const quote = QUOTES[ticker];
  if (!quote) return { ticker, range, points: [] };

  const { points: n, vol, spanMs } = SHAPE[range];
  const end = quote.price;
  const start =
    range === "1D"
      ? quote.open
      : end / (1 + (RETURNS[ticker]?.[range] ?? 10) / 100);

  const rand = mulberry32(hash(`${ticker}:${range}`));
  const walk: number[] = [0];
  let drift = 0;
  for (let i = 1; i < n; i++) {
    // Mild momentum carryover makes the line read like a market, not static.
    drift = drift * 0.72 + (rand() - 0.5) * vol;
    walk.push(walk[i - 1] + drift);
  }

  // Detrend, then lay the walk over the straight start→end path.
  const slope = walk[n - 1] / (n - 1);
  const detrended = walk.map((v, i) => v - slope * i);

  const points: PricePoint[] = detrended.map((wiggle, i) => {
    const base = start + ((end - start) * i) / (n - 1);
    const price = base * (1 + wiggle);
    return {
      t: SESSION_CLOSE - spanMs + (spanMs * i) / (n - 1),
      price: Math.round(price * 100) / 100,
    };
  });

  points[0] = { ...points[0], price: Math.round(start * 100) / 100 };
  points[n - 1] = { ...points[n - 1], price: end };
  return { ticker, range, points };
}

/** Short price array for sparklines — same walk, downsampled. */
export function buildSpark(ticker: string, range: Range = "1D", count = 24): number[] {
  const { points } = seriesFor(ticker, range);
  if (!points.length) return [];
  const step = (points.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => points[Math.round(i * step)].price);
}

/**
 * Chart for any symbol outside the curated nine. Same seeded-walk approach as
 * buildSeries, but anchored on the derived quote instead of hand-set returns.
 */
export function buildSyntheticSeries(
  ticker: string,
  range: Range,
  quote: { price: number; open: number; previousClose: number },
): Series {
  const { points: n, vol, spanMs } = SHAPE[range];
  const end = quote.price;

  // Longer windows imply a larger cumulative drift; sign varies by symbol.
  const drift = { "1D": 0, "1W": 0.04, "1M": 0.09, "3M": 0.17, "1Y": 0.38, "5Y": 1.1 }[range];
  const bias = (hash(`${ticker}:drift`) % 1000) / 1000 - 0.42;
  const start = range === "1D" ? quote.open : end / (1 + drift * bias * 2.6);

  const rand = mulberry32(hash(`${ticker}:syn:${range}`));
  const walk: number[] = [0];
  let step = 0;
  for (let i = 1; i < n; i++) {
    step = step * 0.72 + (rand() - 0.5) * vol;
    walk.push(walk[i - 1] + step);
  }

  const slope = walk[n - 1] / (n - 1);
  const detrended = walk.map((v, i) => v - slope * i);

  const points: PricePoint[] = detrended.map((wiggle, i) => {
    const base = start + ((end - start) * i) / (n - 1);
    return {
      t: SESSION_CLOSE - spanMs + (spanMs * i) / (n - 1),
      price: Math.max(0.01, Math.round(base * (1 + wiggle) * 100) / 100),
    };
  });

  points[0] = { ...points[0], price: Math.max(0.01, Math.round(start * 100) / 100) };
  points[n - 1] = { ...points[n - 1], price: end };
  return { ticker, range, points };
}

/** Curated series when we have one, synthetic otherwise. */
export function seriesFor(ticker: string, range: Range): Series {
  if (QUOTES[ticker]) return buildSeries(ticker, range);
  const quote = deriveQuote(ticker);
  if (!quote) return { ticker, range, points: [] };
  return buildSyntheticSeries(ticker, range, quote);
}

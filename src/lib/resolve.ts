import { deriveQuote } from "@/lib/quote-engine";
import { fetchQuote, fetchQuotes, fetchSeries } from "@/lib/providers/yahoo";
import { seriesFor } from "@/lib/series";
import type { Quote, Range, Series } from "@/lib/types";

export type DataSource = "live" | "simulated";

export interface ResolvedQuote {
  quote: Quote;
  source: DataSource;
}

/** Set SPLASH_LIVE_DATA=0 to force the simulator (useful offline or in tests). */
const LIVE_ENABLED = process.env.SPLASH_LIVE_DATA !== "0";

/**
 * Real data when we can get it, the simulator when we can't — and the caller is
 * always told which it got, so the UI never implies a synthetic price is real.
 *
 * Yahoo's chart endpoint carries no fundamentals, so market cap, P/E and average
 * volume are backfilled from the derived quote and flagged as such on the page.
 */
export async function resolveQuote(ticker: string): Promise<ResolvedQuote> {
  const derived = deriveQuote(ticker);
  if (!LIVE_ENABLED) return { quote: derived, source: "simulated" };

  const live = await fetchQuote(ticker);
  if (!live) return { quote: derived, source: "simulated" };

  // Fundamentals are estimated from the derived quote, so rescale them to the
  // real price — otherwise NVDA shows a market cap computed at $191 next to a
  // live price of $237.
  const scale = derived.price > 0 ? live.price / derived.price : 1;

  return {
    quote: {
      ...live,
      avgVolume: live.avgVolume || derived.avgVolume,
      marketCap: live.marketCap || Math.round(derived.marketCap * scale),
      peRatio: live.peRatio ?? (derived.peRatio ? Math.round(derived.peRatio * scale * 10) / 10 : null),
    },
    source: "live",
  };
}

export async function resolveQuotes(
  tickers: string[],
): Promise<{ quotes: Record<string, Quote>; source: DataSource }> {
  if (!LIVE_ENABLED) {
    return {
      quotes: Object.fromEntries(tickers.map((t) => [t, deriveQuote(t)])),
      source: "simulated",
    };
  }

  const live = await fetchQuotes(tickers);
  const quotes: Record<string, Quote> = {};
  for (const ticker of tickers) {
    quotes[ticker] = live[ticker] ?? deriveQuote(ticker);
  }
  // Mixed results still count as live; per-symbol gaps are rare and invisible.
  return { quotes, source: Object.keys(live).length ? "live" : "simulated" };
}

export async function resolveSeries(
  ticker: string,
  range: Range,
): Promise<{ series: Series; source: DataSource }> {
  if (LIVE_ENABLED) {
    const live = await fetchSeries(ticker, range);
    if (live) return { series: live, source: "live" };
  }
  return { series: seriesFor(ticker, range), source: "simulated" };
}

import type { PricePoint, Quote, Range, Series } from "@/lib/types";

/**
 * Real market data from Yahoo's chart endpoint.
 *
 * Caveats worth knowing before relying on this:
 *
 * - It is an undocumented, unofficial endpoint. Yahoo retired its public API
 *   years ago; this one is widely used but carries no stability guarantee and
 *   could change or start refusing traffic without notice. Every call here is
 *   wrapped so a failure degrades to the simulator rather than breaking a page.
 * - Free Yahoo data is typically delayed ~15 minutes, and it does not move at
 *   all outside market hours. The UI says which mode it is showing rather than
 *   implying real-time.
 * - The batch endpoint (`v7/finance/quote`) now returns Unauthorized without a
 *   session crumb, so symbols are fetched one request each, with a cache and a
 *   concurrency cap in front.
 */

const BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const QUOTE_TTL_MS = 20_000;
const SERIES_TTL_MS = 120_000;
const MAX_CONCURRENT = 6;

interface Cached<T> {
  value: T;
  at: number;
}

const quoteCache = new Map<string, Cached<Quote | null>>();
const seriesCache = new Map<string, Cached<Series | null>>();

const RANGE_PARAMS: Record<Range, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
  "5Y": { range: "5y", interval: "1wk" },
};

interface YahooMeta {
  symbol: string;
  regularMarketPrice?: number;
  chartPreviousClose?: number;
  previousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  longName?: string;
  shortName?: string;
  currency?: string;
  currentTradingPeriod?: {
    pre?: { start: number; end: number };
    regular?: { start: number; end: number };
    post?: { start: number; end: number };
  };
}

interface YahooResponse {
  chart: {
    result?: {
      meta: YahooMeta;
      timestamp?: number[];
      indicators: { quote: { close?: (number | null)[] }[] };
    }[];
    error?: unknown;
  };
}

async function call(url: string, timeoutMs = 6000): Promise<YahooResponse | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as YahooResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Yahoo uses dashes where the listing files use dots: BRK.B -> BRK-B. */
function toYahooSymbol(ticker: string) {
  return ticker.replace(/\./g, "-");
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export async function fetchQuote(ticker: string): Promise<Quote | null> {
  const key = ticker.toUpperCase();
  const hit = quoteCache.get(key);
  if (hit && Date.now() - hit.at < QUOTE_TTL_MS) return hit.value;

  const data = await call(
    `${BASE}/${encodeURIComponent(toYahooSymbol(key))}?interval=1d&range=1d`,
  );
  const meta = data?.chart?.result?.[0]?.meta;

  let quote: Quote | null = null;
  const price = meta?.regularMarketPrice;
  const previousClose = meta?.chartPreviousClose ?? meta?.previousClose;

  if (meta && typeof price === "number" && typeof previousClose === "number" && previousClose > 0) {
    quote = {
      ticker: key,
      price: round(price),
      change: round(price - previousClose),
      changePercent: round(((price - previousClose) / previousClose) * 100),
      dayHigh: round(meta.regularMarketDayHigh ?? price),
      dayLow: round(meta.regularMarketDayLow ?? price),
      open: round(previousClose),
      previousClose: round(previousClose),
      volume: meta.regularMarketVolume ?? 0,
      // The chart endpoint carries no average volume or fundamentals. Leave
      // these at zero so resolveQuote backfills them rather than reporting
      // today's volume as the average, which would make every symbol read
      // "volume in line with average".
      avgVolume: 0,
      marketCap: 0,
      peRatio: null,
      week52High: round(meta.fiftyTwoWeekHigh ?? price),
      week52Low: round(meta.fiftyTwoWeekLow ?? price),
    };
  }

  quoteCache.set(key, { value: quote, at: Date.now() });
  return quote;
}

/** Fetches many symbols with a concurrency cap so one watchlist isn't 30 parallel calls. */
export async function fetchQuotes(tickers: string[]): Promise<Record<string, Quote>> {
  const out: Record<string, Quote> = {};
  const queue = [...new Set(tickers.map((t) => t.toUpperCase()))];

  async function worker() {
    for (;;) {
      const ticker = queue.shift();
      if (!ticker) return;
      const quote = await fetchQuote(ticker);
      if (quote) out[ticker] = quote;
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, worker),
  );
  return out;
}

export async function fetchSeries(ticker: string, range: Range): Promise<Series | null> {
  const key = `${ticker.toUpperCase()}:${range}`;
  const hit = seriesCache.get(key);
  if (hit && Date.now() - hit.at < SERIES_TTL_MS) return hit.value;

  const { range: r, interval } = RANGE_PARAMS[range];
  const data = await call(
    `${BASE}/${encodeURIComponent(toYahooSymbol(ticker))}?interval=${interval}&range=${r}`,
  );

  const result = data?.chart?.result?.[0];
  const stamps = result?.timestamp;
  const closes = result?.indicators?.quote?.[0]?.close;

  let series: Series | null = null;
  if (stamps?.length && closes?.length) {
    const points: PricePoint[] = [];
    for (let i = 0; i < stamps.length; i++) {
      const close = closes[i];
      // Yahoo emits nulls for halted or untraded bars; drop them.
      if (typeof close !== "number") continue;
      points.push({ t: stamps[i] * 1000, price: round(close) });
    }
    if (points.length >= 2) series = { ticker: ticker.toUpperCase(), range, points };
  }

  seriesCache.set(key, { value: series, at: Date.now() });
  return series;
}

export async function fetchName(ticker: string): Promise<string | null> {
  const data = await call(
    `${BASE}/${encodeURIComponent(toYahooSymbol(ticker))}?interval=1d&range=1d`,
  );
  const meta = data?.chart?.result?.[0]?.meta;
  return meta?.longName ?? meta?.shortName ?? null;
}

export type MarketState = "pre" | "regular" | "post" | "closed";

/**
 * The chart endpoint has no `marketState` field — it exposes the session
 * boundaries instead, so the phase is derived by comparing them to now.
 * Returns null when the upstream call fails, which the caller reads as
 * "unknown" rather than "closed".
 */
export async function fetchMarketState(ticker = "SPY"): Promise<MarketState | null> {
  const data = await call(`${BASE}/${encodeURIComponent(ticker)}?interval=1d&range=1d`);
  const period = data?.chart?.result?.[0]?.meta?.currentTradingPeriod;
  if (!period) return null;

  const now = Math.floor(Date.now() / 1000);
  if (period.regular && now >= period.regular.start && now < period.regular.end) return "regular";
  if (period.pre && now >= period.pre.start && now < period.pre.end) return "pre";
  if (period.post && now >= period.post.start && now < period.post.end) return "post";
  return "closed";
}

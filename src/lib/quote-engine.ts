import { QUOTES } from "@/data/stocks";
import type { Quote } from "@/lib/types";

/**
 * Splash covers every listed symbol, so a quote has to exist for ~12,900
 * tickers. The nine curated names use hand-set figures; everything else is
 * derived here.
 *
 * Two constraints shape this module:
 *
 * 1. Derivation keys off the ticker string and nothing else — no clock, no
 *    Math.random — so the server and the first client render agree.
 * 2. It must not import the universe index. The tick engine runs on the client,
 *    and pulling universe.json (877KB) into the browser bundle to read one ETF
 *    flag would dwarf the rest of the app. Company names and listing data stay
 *    server-side; see src/lib/universe.ts.
 *
 * Live movement is layered on afterwards by the tick engine.
 */

function hash(str: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

/** Share price is roughly log-normal across a real market; this mimics that. */
function basePrice(ticker: string) {
  const r = hash(ticker, 11);
  const tail = hash(ticker, 23);
  if (tail > 0.985) return round(420 + Math.exp(r * 3.4) * 90); // rare high-dollar names
  return round(1.2 + Math.exp(r * 5.6) * 1.35);
}

/** Smaller, cheaper names move more than large ones. */
export function volatilityFor(ticker: string, price: number) {
  const sizeDamp = Math.min(1, 140 / Math.max(price, 8));
  return 0.021 * (0.55 + hash(ticker, 37) * 0.9) * (0.6 + sizeDamp * 0.75);
}

export function deriveQuote(ticker: string): Quote {
  const curated = QUOTES[ticker];
  if (curated) return curated;

  const previousClose = basePrice(ticker);
  const vol = volatilityFor(ticker, previousClose);

  // Day move, centred slightly positive to match a generally rising tape.
  const changePercent = round((hash(ticker, 41) - 0.47) * 2 * vol * 190);
  const price = round(previousClose * (1 + changePercent / 100));

  const spread = Math.abs(changePercent) / 100 + vol * 1.4;
  const dayHigh = round(Math.max(price, previousClose) * (1 + spread * hash(ticker, 53) * 0.6));
  const dayLow = round(Math.min(price, previousClose) * (1 - spread * hash(ticker, 59) * 0.6));
  const open = round(previousClose * (1 + (hash(ticker, 61) - 0.5) * vol));

  const shares = Math.round(2_000_000 + Math.exp(hash(ticker, 67) * 7.9) * 9_000_000);
  const avgVolume = Math.round(shares * (0.004 + hash(ticker, 71) * 0.05));
  const volume = Math.round(avgVolume * (0.45 + hash(ticker, 73) * 1.9));
  const profitable = hash(ticker, 79) > 0.34;

  return {
    ticker,
    price,
    change: round(price - previousClose),
    changePercent,
    dayHigh,
    dayLow,
    open,
    previousClose,
    volume,
    avgVolume,
    marketCap: Math.round(price * shares),
    peRatio: profitable ? round(7 + hash(ticker, 83) * 58) : null,
    week52High: round(Math.max(dayHigh, price * (1.08 + hash(ticker, 89) * 1.1))),
    week52Low: round(Math.min(dayLow, price * (0.32 + hash(ticker, 97) * 0.5))),
  };
}

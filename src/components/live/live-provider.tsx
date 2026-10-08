"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { deriveQuote, volatilityFor } from "@/lib/quote-engine";
import type { LiveMoment, LiveTick } from "@/lib/live-types";
import { detectMoments } from "@/lib/moments";

const TICK_MS = 1400;

interface TickerState extends LiveTick {
  /** Levels already announced, so a moment fires once per threshold. */
  fired: Set<string>;
  upStreak: number;
  downStreak: number;
  announcedHigh: number;
  announcedLow: number;
  lastExtremeAt: number;
}

/**
 * The tick engine. One interval drives every subscribed symbol, so a list of
 * thirty rows costs one timer rather than thirty.
 *
 * Each symbol starts at exactly the price the server rendered and only begins
 * moving after mount — that keeps hydration clean while still feeling live.
 */
class Engine {
  private state = new Map<string, TickerState>();
  private subs = new Map<string, number>();
  private listeners = new Set<() => void>();
  private momentListeners = new Set<(m: LiveMoment) => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  /** Bumped on every tick; snapshots key off it so React sees a new value. */
  version = 0;

  private ensure(ticker: string): TickerState {
    const existing = this.state.get(ticker);
    if (existing) return existing;

    const quote = deriveQuote(ticker);

    const alreadyPassed = new Set<string>();
    const dir = quote.changePercent > 0 ? "u" : "d";
    for (const m of [1, 2, 3, 5, 7, 10, 15, 20]) {
      if (Math.abs(quote.changePercent) >= m) alreadyPassed.add(`pct:${m}:${dir}`);
    }

    const fresh: TickerState = {
      ticker,
      price: quote.price,
      previousClose: quote.previousClose,
      changePercent: quote.changePercent,
      dayHigh: quote.dayHigh,
      dayLow: quote.dayLow,
      volume: quote.volume,
      direction: 0,
      fired: alreadyPassed,
      upStreak: 0,
      downStreak: 0,
      announcedHigh: quote.dayHigh,
      announcedLow: quote.dayLow,
      lastExtremeAt: 0,
    };
    this.state.set(ticker, fresh);
    return fresh;
  }

  subscribe(ticker: string) {
    this.subs.set(ticker, (this.subs.get(ticker) ?? 0) + 1);
    this.ensure(ticker);
    this.start();
    return () => {
      const n = (this.subs.get(ticker) ?? 1) - 1;
      if (n <= 0) this.subs.delete(ticker);
      else this.subs.set(ticker, n);
      if (this.subs.size === 0) this.stop();
    };
  }

  onChange(listener: () => void) {
    this.listeners.add(listener);
    return () => void this.listeners.delete(listener);
  }

  onMoment(listener: (m: LiveMoment) => void) {
    this.momentListeners.add(listener);
    return () => void this.momentListeners.delete(listener);
  }

  get(ticker: string): LiveTick {
    return this.state.get(ticker) ?? this.ensure(ticker);
  }

  private start() {
    if (this.timer || typeof window === "undefined") return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private tick() {
    for (const ticker of this.subs.keys()) {
      const s = this.state.get(ticker);
      if (!s) continue;

      const vol = volatilityFor(ticker, s.price);

      // Per-tick move, scaled so a symbol drifts a believable fraction of a
      // percent over a minute rather than swinging wildly every second. The
      // mild pull toward the previous close stops a long-open tab wandering off.
      const shock = (Math.random() + Math.random() + Math.random() - 1.5) * vol * 0.07;
      const pull = ((s.previousClose - s.price) / s.price) * 0.006;
      const next = Math.max(0.01, s.price * (1 + shock + pull));

      const prev = s.price;
      s.price = Math.round(next * 100) / 100;
      s.direction = s.price > prev ? 1 : s.price < prev ? -1 : 0;
      s.changePercent =
        Math.round(((s.price - s.previousClose) / s.previousClose) * 10000) / 100;
      s.dayHigh = Math.max(s.dayHigh, s.price);
      s.dayLow = Math.min(s.dayLow, s.price);
      s.volume += Math.round(Math.random() * (s.volume * 0.0009));
      s.upStreak = s.direction > 0 ? s.upStreak + 1 : 0;
      s.downStreak = s.direction < 0 ? s.downStreak + 1 : 0;

      for (const moment of detectMoments(s, prev)) {
        this.momentListeners.forEach((l) => l(moment));
      }
    }

    this.version++;
    this.listeners.forEach((l) => l());
  }
}

const engine = new Engine();

const LiveCtx = createContext<Engine>(engine);

export function LiveProvider({ children }: { children: ReactNode }) {
  return <LiveCtx.Provider value={engine}>{children}</LiveCtx.Provider>;
}

/**
 * Live price for one symbol. Returns the server-rendered snapshot on the first
 * render, then updates on every tick.
 */
export function useLiveTick(ticker: string): LiveTick {
  const eng = useContext(LiveCtx);

  useEffect(() => eng.subscribe(ticker), [eng, ticker]);

  const subscribe = useCallback((cb: () => void) => eng.onChange(cb), [eng]);
  const getSnapshot = useCallback(() => eng.version, [eng]);
  useSyncExternalStore(subscribe, getSnapshot, () => 0);

  return eng.get(ticker);
}

/** Subscribes to many symbols at once without a hook per row. */
export function useLiveTicks(tickers: string[]): Record<string, LiveTick> {
  const eng = useContext(LiveCtx);
  const key = tickers.join(",");

  useEffect(() => {
    const unsubs = tickers.map((t) => eng.subscribe(t));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng, key]);

  const subscribe = useCallback((cb: () => void) => eng.onChange(cb), [eng]);
  const getSnapshot = useCallback(() => eng.version, [eng]);
  const version = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  return useMemo(() => {
    const out: Record<string, LiveTick> = {};
    for (const t of tickers) {
      out[t] = eng.get(t);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng, key, version]);
}

/**
 * Play-by-play stream. New moments arrive as prices cross levels, matching the
 * granularity Real uses for individual plays.
 */
export function useMomentStream(tickers: string[], max = 40) {
  const eng = useContext(LiveCtx);
  const [moments, setMoments] = useState<LiveMoment[]>([]);
  const watched = useRef(new Set(tickers));
  const key = tickers.join(",");
  useEffect(() => {
    watched.current = new Set(tickers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    const unsubs = tickers.map((t) => eng.subscribe(t));
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eng, key]);

  useEffect(
    () =>
      eng.onMoment((m) => {
        if (!watched.current.has(m.ticker)) return;
        setMoments((prev) => [m, ...prev].slice(0, max));
      }),
    [eng, max],
  );

  return moments;
}

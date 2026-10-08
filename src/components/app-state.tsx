"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { currentUser } from "@/data/social";

const STORAGE_KEY = "splash.state.v1";

interface Stored {
  watchlist: string[];
  onboarded: boolean;
  ready: boolean;
}

interface AppState extends Stored {
  isWatched: (ticker: string) => boolean;
  toggleWatch: (ticker: string) => void;
  setWatchlist: (tickers: string[]) => void;
  completeOnboarding: (tickers: string[]) => void;
  resetOnboarding: () => void;
}

/**
 * The server has no localStorage, so it renders this; React swaps in the real
 * client snapshot after hydration without a mismatch.
 */
const SERVER_SNAPSHOT: Stored = {
  watchlist: currentUser().watchlist,
  onboarded: true,
  ready: false,
};

const listeners = new Set<() => void>();
// useSyncExternalStore compares snapshots by identity, so the parsed value is
// cached and only replaced when storage actually changes.
let snapshot: Stored | null = null;

function read(): Stored {
  if (snapshot) return snapshot;
  let next: Stored = { ...SERVER_SNAPSHOT, ready: true };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stored>;
      if (Array.isArray(parsed.watchlist)) {
        next = {
          watchlist: parsed.watchlist,
          onboarded: parsed.onboarded ?? true,
          ready: true,
        };
      }
    }
  } catch {
    /* corrupt or unavailable storage falls back to the defaults */
  }
  snapshot = next;
  return next;
}

function write(next: Omit<Stored, "ready">) {
  snapshot = { ...next, ready: true };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* private mode — the in-memory snapshot still drives the UI */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

const Ctx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, read, () => SERVER_SNAPSHOT);

  const value = useMemo<AppState>(
    () => ({
      ...state,
      isWatched: (ticker) => state.watchlist.includes(ticker),
      toggleWatch: (ticker) =>
        write({
          onboarded: state.onboarded,
          watchlist: state.watchlist.includes(ticker)
            ? state.watchlist.filter((t) => t !== ticker)
            : [...state.watchlist, ticker],
        }),
      setWatchlist: (watchlist) => write({ onboarded: state.onboarded, watchlist }),
      completeOnboarding: (watchlist) => write({ watchlist, onboarded: true }),
      resetOnboarding: () => write({ watchlist: [], onboarded: false }),
    }),
    [state],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}

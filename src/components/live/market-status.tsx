"use client";

import { useEffect, useState } from "react";

/**
 * States what the prices on screen actually are. Asked once on mount rather
 * than threaded through every page, since it is the same answer app-wide.
 */
export function MarketStatus() {
  const [state, setState] = useState<{ source: string; open: boolean; state: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/market-state")
      .then((r) => r.json())
      .then((d: { source: string; open: boolean; state: string }) => {
        if (!cancelled) setState(d);
      })
      .catch(() => {
        /* leave the tag off rather than guessing */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) return null;

  if (state.source !== "live") {
    return (
      <span className="rounded-md bg-raised px-1.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] text-faint uppercase">
        Simulated
      </span>
    );
  }

  return (
    <span
      title="Real market data from Yahoo, typically delayed about 15 minutes"
      className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] uppercase ${
        state.open ? "bg-up/14 text-up" : "bg-raised text-muted"
      }`}
    >
      <span className={`size-1.5 rounded-full ${state.open ? "live-dot bg-up" : "bg-faint"}`} />
      {state.open
        ? "Live · 15m delay"
        : state.state === "pre"
          ? "Pre-market"
          : state.state === "post"
            ? "After hours"
            : "Market closed"}
    </span>
  );
}

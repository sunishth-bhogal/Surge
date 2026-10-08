"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useLiveTicks } from "@/components/live/live-provider";
import { Sparkline } from "@/components/ui/sparkline";
import { price, signedPercent } from "@/lib/format";
import { deriveQuote } from "@/lib/quote-engine";
import { buildSpark } from "@/lib/series";

export function WatchlistRail({ tickers }: { tickers: string[] }) {
  const ticks = useLiveTicks(tickers);

  return (
    <div className="rail -mx-4 flex gap-2 px-4">
      {tickers.map((ticker) => {
        const quote = deriveQuote(ticker);

        const live = ticks[ticker];
        const value = live?.price ?? quote.price;
        const change = live?.changePercent ?? quote.changePercent;
        const up = change >= 0;

        return (
          <Link
            key={ticker}
            href={`/stock/${encodeURIComponent(ticker)}`}
            className="min-w-[116px] rounded-2xl border border-line-soft bg-surface px-3.5 py-3 transition-colors hover:border-faint/40"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-bold tracking-[-0.01em]">{ticker}</span>
              <Sparkline points={buildSpark(ticker, "1D", 14)} positive={up} width={32} height={16} />
            </div>
            <p className="tnum mt-2 text-[15px] leading-none font-bold tracking-[-0.02em]">
              {price(value)}
            </p>
            <p
              className="tnum mt-1.5 text-[12.5px] font-semibold"
              style={{ color: up ? "var(--color-up)" : "var(--color-down)" }}
            >
              {signedPercent(change)}
            </p>
          </Link>
        );
      })}

      <Link
        href="/search"
        className="grid min-w-[56px] place-items-center rounded-2xl border border-dashed border-line text-faint transition-colors hover:border-faint/60 hover:text-muted"
        aria-label="Add to watchlist"
      >
        <Plus size={18} strokeWidth={2.2} />
      </Link>
    </div>
  );
}

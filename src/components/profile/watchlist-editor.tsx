"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useAppState } from "@/components/app-state";
import { Card, Delta, TickerBadge } from "@/components/ui/primitives";
import { QUOTES, STOCKS } from "@/data/stocks";
import { price } from "@/lib/format";

export function WatchlistEditor() {
  const { watchlist, toggleWatch, ready } = useAppState();
  const unwatched = STOCKS.filter((s) => !watchlist.includes(s.ticker));

  if (!ready) return <Card className="h-40"><span /></Card>;

  return (
    <>
      <Card className="divide-y divide-line-soft">
        {watchlist.length === 0 && (
          <p className="px-4 py-8 text-center text-[13.5px] text-faint">
            Your watchlist is empty. Add a few names below.
          </p>
        )}
        {watchlist.map((ticker) => {
          const stock = STOCKS.find((s) => s.ticker === ticker);
          const quote = QUOTES[ticker];
          if (!stock || !quote) return null;
          return (
            <div key={ticker} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/stock/${ticker}`} className="flex min-w-0 flex-1 items-center gap-3">
                <TickerBadge ticker={ticker} color={stock.logoColor} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{ticker}</p>
                  <p className="truncate text-[12px] text-faint">{stock.companyName}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-[13.5px] font-semibold">{price(quote.price)}</p>
                  <div className="mt-0.5 flex justify-end">
                    <Delta value={quote.changePercent} showBg={false} />
                  </div>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => toggleWatch(ticker)}
                aria-label={`Remove ${ticker} from watchlist`}
                className="grid size-7 shrink-0 place-items-center rounded-full bg-raised text-faint transition-colors hover:bg-down/15 hover:text-down"
              >
                <Minus size={14} strokeWidth={2.6} />
              </button>
            </div>
          );
        })}
      </Card>

      {unwatched.length > 0 && (
        <div className="rail -mx-4 mt-3 flex gap-2 px-4">
          {unwatched.map((stock) => (
            <button
              key={stock.ticker}
              type="button"
              onClick={() => toggleWatch(stock.ticker)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-muted transition-colors hover:border-accent/50 hover:text-bright"
            >
              <Plus size={13} strokeWidth={2.6} />
              {stock.ticker}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { Users } from "lucide-react";
import { useLiveTick } from "@/components/live/live-provider";
import { TickerBadge } from "@/components/ui/primitives";
import { compact } from "@/lib/format";
import { moveHeadline } from "@/lib/storyline";
import type { Quote } from "@/lib/types";

export function StockLiveHeader({
  ticker,
  exchange,
  isEtf,
  quote,
  viewers,
  posts,
}: {
  ticker: string;
  exchange: string;
  isEtf: boolean;
  quote: Quote;
  viewers: number;
  posts?: number;
}) {
  const tick = useLiveTick(ticker);
  const changePercent = tick?.changePercent ?? quote.changePercent;

  return (
    <section className="flex items-center gap-3 pt-5">
      <TickerBadge ticker={ticker} color="#3d7dff" size={44} />
      <div className="min-w-0 flex-1">
        <h2 className="text-[19px] leading-tight font-bold tracking-[-0.025em]">
          {moveHeadline(ticker, changePercent)}
        </h2>
        <p className="flex items-center gap-1.5 truncate text-[13px] text-faint">
          <Users size={12} strokeWidth={2.2} className="shrink-0" />
          <span className="tnum">{compact(viewers)} here</span>
          {posts ? <span className="tnum">· {compact(posts)} posts</span> : null}
          <span className="truncate">· {exchange}</span>
          {isEtf && <span className="shrink-0 rounded bg-raised px-1 text-[10px] font-bold">ETF</span>}
        </p>
      </div>
    </section>
  );
}

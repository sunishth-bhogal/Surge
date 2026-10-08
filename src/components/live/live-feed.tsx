"use client";

import { AnimatePresence } from "motion/react";
import { Radio } from "lucide-react";
import { useMomentStream } from "@/components/live/live-provider";
import { MomentCard } from "@/components/live/moment-card";

export function LiveFeed({ tickers }: { tickers: string[] }) {
  const moments = useMomentStream(tickers);

  return (
    <div className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} />
        ))}
      </AnimatePresence>

      {moments.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-card border border-dashed border-line px-4 py-10 text-center">
          <Radio size={20} strokeWidth={2} className="text-faint live-dot" />
          <p className="text-[13.5px] font-medium text-muted">Watching the tape</p>
          <p className="max-w-[260px] text-[12.5px] leading-relaxed text-faint">
            Plays appear here the moment they happen — levels broken, new highs, runs on the
            tape across the {tickers.length} symbols you follow.
          </p>
        </div>
      )}
    </div>
  );
}

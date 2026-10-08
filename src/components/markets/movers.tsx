"use client";

import { useState } from "react";
import { StockRow } from "@/components/markets/stock-row";
import { TRENDING } from "@/data/social";

const TABS = ["Gainers", "Losers", "Most Active"] as const;
type Tab = (typeof TABS)[number];

export function Movers() {
  const [tab, setTab] = useState<Tab>("Gainers");

  const rows = [...TRENDING].sort((a, b) => {
    if (tab === "Gainers") return b.changePercent - a.changePercent;
    if (tab === "Losers") return a.changePercent - b.changePercent;
    return b.posts - a.posts;
  });

  return (
    <div>
      <div className="mb-3 flex gap-1 rounded-xl bg-raised p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={t === tab}
            className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
              t === tab ? "bg-hover text-bright" : "text-faint hover:text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="divide-y divide-line-soft overflow-hidden rounded-card border border-line-soft bg-surface">
        {rows.slice(0, 5).map((row) => (
          <StockRow key={row.ticker} row={row} />
        ))}
      </div>
    </div>
  );
}

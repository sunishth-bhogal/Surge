"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { Card, Eyebrow, TickerBadge } from "@/components/ui/primitives";
import { compact } from "@/lib/format";
import type { Prediction, Stock } from "@/lib/types";

export function PredictionCard({
  prediction,
  stock,
  compactMode = false,
}: {
  prediction: Prediction;
  stock: Stock;
  compactMode?: boolean;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <Card as="article" className="p-4">
      <div className="flex items-center gap-2.5">
        {!compactMode && <TickerBadge ticker={stock.ticker} color={stock.logoColor} size={30} />}
        <div className="flex items-center gap-2">
          <Eyebrow>Prediction</Eyebrow>
          <Link
            href={`/stock/${stock.ticker}`}
            className="text-[12.5px] font-semibold text-muted transition-colors hover:text-accent"
          >
            {stock.ticker}
          </Link>
        </div>
      </div>

      <h3 className="mt-2.5 text-[18px] leading-snug font-bold tracking-[-0.02em]">
        {prediction.question}
      </h3>

      <div className="mt-3.5 flex flex-col gap-2">
        {prediction.options.map((option) => {
          const mine = picked === option.label;
          const pct = Math.round(option.share * 100);
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => setPicked(mine ? null : option.label)}
              aria-pressed={mine}
              className={`relative isolate overflow-hidden rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                mine ? "border-accent/60 bg-accent/8" : "border-line bg-raised hover:border-faint/50"
              }`}
            >
              <motion.span
                aria-hidden
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute inset-y-0 left-0 -z-10 ${mine ? "bg-accent/22" : "bg-hover"}`}
              />
              <span className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[14.5px] font-semibold">
                  {mine && <Check size={14} strokeWidth={3} className="text-accent" />}
                  {option.label}
                </span>
                <span className="tnum text-[14px] font-bold text-muted">{pct}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-faint">
        <span className="tnum">{compact(prediction.totalPredictions)} predictions</span>
        <span>{picked ? "Locked in · +0 karma until resolved" : prediction.closesIn}</span>
      </div>
    </Card>
  );
}

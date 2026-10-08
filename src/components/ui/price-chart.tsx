"use client";

import { useMemo, useRef, useState } from "react";
import { price as fmtPrice, signedPercent } from "@/lib/format";
import type { PricePoint, Range } from "@/lib/types";

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
const VB_W = 1000;
const VB_H = 260;

export function PriceChart({
  series,
  previousClose,
}: {
  series: Record<Range, PricePoint[]>;
  previousClose: number;
}) {
  const [range, setRange] = useState<Range>("1D");
  const [scrub, setScrub] = useState<number | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const points = series[range];

  const geometry = useMemo(() => {
    const values = points.map((p) => p.price);
    const baseline = range === "1D" ? previousClose : points[0].price;
    const min = Math.min(...values, baseline);
    const max = Math.max(...values, baseline);
    const span = max - min || 1;
    const padY = 18;

    const x = (i: number) => (i / (points.length - 1)) * VB_W;
    const y = (v: number) => padY + (1 - (v - min) / span) * (VB_H - padY * 2);

    const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.price).toFixed(1)}`).join(" ");
    const area = `${line} L${VB_W} ${VB_H} L0 ${VB_H} Z`;

    return { line, area, baselineY: y(baseline), baseline, x, y };
  }, [points, range, previousClose]);

  const last = points[points.length - 1].price;
  const baseline = geometry.baseline;
  const activeIndex = scrub ?? points.length - 1;
  const activePoint = points[activeIndex];
  const shownPrice = activePoint.price;
  const shownChange = ((shownPrice - baseline) / baseline) * 100;
  const positive = (scrub === null ? last : shownPrice) >= baseline;
  const stroke = positive ? "var(--color-up)" : "var(--color-down)";

  function indexFromClientX(clientX: number) {
    const el = hostRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * (points.length - 1));
  }

  const leftPct = (activeIndex / (points.length - 1)) * 100;
  const topPct = (geometry.y(shownPrice) / VB_H) * 100;

  return (
    <div>
      <div className="flex items-end justify-between px-1">
        <div>
          <div className="tnum text-[34px] leading-none font-bold tracking-[-0.03em]">
            {fmtPrice(shownPrice)}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className="tnum text-[15px] font-semibold"
              style={{ color: shownChange >= 0 ? "var(--color-up)" : "var(--color-down)" }}
            >
              {signedPercent(shownChange)}
            </span>
            <span className="text-[13px] text-faint">
              {scrub === null ? labelFor(range) : timeLabel(activePoint, range)}
            </span>
          </div>
        </div>
      </div>

      <div
        ref={hostRef}
        className="relative mt-4 h-[180px] touch-none select-none sm:h-[220px]"
        onPointerDown={(e) => setScrub(indexFromClientX(e.clientX))}
        onPointerMove={(e) => {
          if (e.pressure > 0 || e.buttons > 0) setScrub(indexFromClientX(e.clientX));
        }}
        onPointerUp={() => setScrub(null)}
        onPointerLeave={() => setScrub(null)}
        onMouseMove={(e) => setScrub(indexFromClientX(e.clientX))}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-label={`${range} price chart`}
          role="img"
        >
          <defs>
            <linearGradient id={`fill-${positive ? "up" : "down"}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.26" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1="0"
            x2={VB_W}
            y1={geometry.baselineY}
            y2={geometry.baselineY}
            stroke="var(--color-line)"
            strokeWidth="1"
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
          />
          <path d={geometry.area} fill={`url(#fill-${positive ? "up" : "down"})`} />
          <path
            d={geometry.line}
            fill="none"
            stroke={stroke}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {scrub !== null && (
            <line
              x1={geometry.x(activeIndex)}
              x2={geometry.x(activeIndex)}
              y1="0"
              y2={VB_H}
              stroke="var(--color-faint)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <span
          className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-3 ring-ink"
          style={{ left: `${leftPct}%`, top: `${topPct}%`, background: stroke }}
        />
      </div>

      <div className="mt-4 flex gap-1 rounded-xl bg-raised p-1">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => {
              setRange(r);
              setScrub(null);
            }}
            className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
              r === range ? "bg-hover text-bright" : "text-faint hover:text-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

function labelFor(range: Range) {
  return {
    "1D": "Today",
    "1W": "Past week",
    "1M": "Past month",
    "3M": "Past 3 months",
    "1Y": "Past year",
    "5Y": "Past 5 years",
  }[range];
}

function timeLabel(point: PricePoint, range: Range) {
  const d = new Date(point.t);
  if (range === "1D") {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: range === "1Y" || range === "5Y" ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

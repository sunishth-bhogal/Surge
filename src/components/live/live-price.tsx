"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveTick } from "@/components/live/live-provider";
import { price as fmtPrice, signedPercent } from "@/lib/format";

/** Brief tint on the digits whenever the price moves, like a real tape. */
function useFlash(value: number) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    setFlash(value > prev.current ? "up" : "down");
    prev.current = value;
    const t = setTimeout(() => setFlash(null), 620);
    return () => clearTimeout(t);
  }, [value]);

  return flash;
}

export function LivePrice({
  ticker,
  fallback,
  className = "",
}: {
  ticker: string;
  fallback: number;
  className?: string;
}) {
  const tick = useLiveTick(ticker);
  const value = tick?.price ?? fallback;
  const flash = useFlash(value);

  return (
    <span
      className={`tnum transition-colors duration-200 ${className} ${
        flash === "up" ? "text-up" : flash === "down" ? "text-down" : ""
      }`}
    >
      {fmtPrice(value)}
    </span>
  );
}

export function LiveDelta({
  ticker,
  fallback,
  showBg = true,
  size = "sm",
}: {
  ticker: string;
  fallback: number;
  showBg?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const tick = useLiveTick(ticker);
  const value = tick?.changePercent ?? fallback;
  const up = value >= 0;
  const sizes = {
    sm: "text-[12.5px] px-1.5 py-0.5",
    md: "text-[14px] px-2 py-0.5",
    lg: "text-[17px] px-2.5 py-1",
  }[size];

  return (
    <span
      className={`tnum inline-flex items-center rounded-lg font-semibold ${sizes} ${
        up ? "text-up" : "text-down"
      } ${showBg ? (up ? "bg-up/12" : "bg-down/12") : "px-0"}`}
    >
      {signedPercent(value)}
    </span>
  );
}

/** Small up/down caret that pulses on each tick. */
export function TickPulse({ ticker }: { ticker: string }) {
  const tick = useLiveTick(ticker);
  if (!tick || tick.direction === 0) return <span className="size-1.5" />;
  return (
    <span
      className={`size-1.5 rounded-full ${tick.direction > 0 ? "bg-up" : "bg-down"}`}
      aria-hidden
    />
  );
}

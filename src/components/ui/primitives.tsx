import Link from "next/link";
import type { ReactNode } from "react";
import { signedPercent } from "@/lib/format";
import type { Sentiment } from "@/lib/types";

export function Card({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-card border border-line-soft bg-surface ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Delta({
  value,
  size = "sm",
  showBg = true,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  showBg?: boolean;
}) {
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

export function TickerBadge({
  ticker,
  color,
  size = 34,
}: {
  ticker: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-xl font-bold"
      style={{
        width: size,
        height: size,
        background: `color-mix(in oklab, ${color} 22%, #101214)`,
        color,
        fontSize: size * 0.34,
        letterSpacing: "-0.02em",
      }}
    >
      {ticker.slice(0, 2)}
    </span>
  );
}

export function TickerLink({
  ticker,
  className = "",
}: {
  ticker: string;
  className?: string;
}) {
  return (
    <Link
      href={`/stock/${ticker}`}
      className={`font-semibold text-bright transition-colors hover:text-accent ${className}`}
    >
      {ticker}
    </Link>
  );
}

export function Avatar({
  initials,
  color,
  size = 36,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold text-ink"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function LiveTag({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-down/14 px-1.5 py-0.5 text-[10.5px] font-bold tracking-[0.1em] text-down uppercase">
      <span className="live-dot size-1.5 rounded-full bg-down" />
      {label}
    </span>
  );
}

export function SentimentPill({ sentiment }: { sentiment: Sentiment }) {
  const map = {
    bullish: { label: "Bullish", cls: "text-up bg-up/12" },
    bearish: { label: "Bearish", cls: "text-down bg-down/12" },
    neutral: { label: "Neutral", cls: "text-faint bg-hover" },
  }[sentiment];
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.07em] ${map.cls}`}>
      {map.label}
    </span>
  );
}

export function SectionHeader({
  title,
  action,
  href,
}: {
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-1">
      <h2 className="text-[19px] font-bold tracking-[-0.02em]">{title}</h2>
      {action && href && (
        <Link href={href} className="text-[13px] font-medium text-accent hover:underline">
          {action}
        </Link>
      )}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.13em] text-faint">
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11.5px] font-medium text-faint">{label}</span>
      <span className="tnum text-[15px] font-semibold">{value}</span>
    </div>
  );
}

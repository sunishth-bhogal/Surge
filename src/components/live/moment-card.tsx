"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Flame,
  MessageCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar, TickerBadge } from "@/components/ui/primitives";
import { makeMessage } from "@/lib/chatter";
import { price as fmtPrice, signedPercent } from "@/lib/format";
import type { LiveMoment, MomentKind } from "@/lib/live-types";
import type { ChatMessage } from "@/lib/chatter";

/** Icon follows the play's own direction, so a lost level points down. */
function MomentIcon({ kind, tone }: { kind: MomentKind; tone: "up" | "down" }) {
  const props = { size: 14, strokeWidth: 2.4 } as const;
  if (kind === "level")
    return tone === "up" ? <ArrowUpRight {...props} /> : <ArrowDownRight {...props} />;
  if (kind === "high") return <TrendingUp {...props} />;
  if (kind === "low") return <TrendingDown {...props} />;
  if (kind === "milestone") return <Flame {...props} />;
  return <BarChart3 {...props} />;
}

const MOMENT_LABEL: Record<MomentKind, string> = {
  level: "Level broken",
  high: "Session high",
  low: "Session low",
  milestone: "Day milestone",
  streak: "Run on the tape",
  reversal: "Reversal",
  volume: "Volume surge",
};

const GLYPHS = ["🔥", "🚀", "👀", "😂", "💀", "🐂", "🐻"] as const;

/** Deterministic-ish colour band from the symbol, so badges stay stable. */
function badgeColor(ticker: string) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
  const hues = ["#30d158", "#3d7dff", "#ff9f0a", "#bf5af2", "#64d2ff", "#ff453a"];
  return hues[h % hues.length];
}

/**
 * One play in the stream. Modelled on Real: every individual moment carries its
 * own reactions and its own discussion, rather than rolling up into a summary.
 */
export function MomentCard({ moment }: { moment: LiveMoment }) {
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<ChatMessage[]>([]);

  const up = moment.tone === "up";
  const dayUp = moment.changePercent >= 0;
  const total = Object.values(reactions).reduce((a, b) => a + b, 0);

  function react(glyph: string) {
    setReactions((r) => ({ ...r, [glyph]: (r[glyph] ?? 0) + (r[glyph] ? -1 : 1) }));
  }

  function toggleThread() {
    const next = !open;
    setOpen(next);
    if (next && replies.length === 0) {
      setReplies(
        Array.from({ length: 2 }, () =>
          makeMessage({
            ticker: moment.ticker,
            price: moment.price,
            previousClose: moment.price,
            changePercent: moment.changePercent,
            dayHigh: moment.price,
            dayLow: moment.price,
            volume: 0,
            direction: 0,
          }),
        ),
      );
    }
  }

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: -10, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-card border bg-surface p-3.5 ${
        moment.intensity === "big"
          ? up
            ? "border-up/35"
            : "border-down/35"
          : "border-line-soft"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Link href={`/stock/${moment.ticker}`} aria-label={moment.ticker}>
          <TickerBadge ticker={moment.ticker} color={badgeColor(moment.ticker)} size={30} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/stock/${moment.ticker}`}
            className="text-[13.5px] font-bold transition-colors hover:text-accent"
          >
            {moment.ticker}
          </Link>
          <p className="truncate text-[11.5px] text-faint">{MOMENT_LABEL[moment.kind]}</p>
        </div>
        <span
          className={`grid size-7 shrink-0 place-items-center rounded-full ${
            up ? "bg-up/12 text-up" : "bg-down/12 text-down"
          }`}
        >
          <MomentIcon kind={moment.kind} tone={moment.tone} />
        </span>
      </div>

      <h3 className="mt-2.5 text-[15.5px] leading-snug font-bold tracking-[-0.015em]">
        {moment.headline}
      </h3>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{moment.detail}</p>

      <div className="mt-2.5 flex items-center gap-2">
        <span className="tnum text-[14px] font-bold">{fmtPrice(moment.price)}</span>
        <span
          className="tnum text-[12.5px] font-semibold"
          style={{ color: dayUp ? "var(--color-up)" : "var(--color-down)" }}
        >
          {signedPercent(moment.changePercent)}
        </span>
        <span className="ml-auto text-[11.5px] text-faint">
          {new Date(moment.at).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2 border-t border-line-soft pt-2.5">
        {GLYPHS.map((g) => {
          const count = reactions[g] ?? 0;
          return (
            <button
              key={g}
              type="button"
              onClick={() => react(g)}
              aria-label={`React ${g}`}
              aria-pressed={count > 0}
              className={`rounded-lg px-1.5 py-1 text-[14px] leading-none transition-colors ${
                count > 0 ? "bg-accent/18" : "hover:bg-raised"
              }`}
            >
              {g}
              {count > 0 && <span className="tnum ml-1 text-[11px] font-bold text-accent">{count}</span>}
            </button>
          );
        })}

        <button
          type="button"
          onClick={toggleThread}
          aria-expanded={open}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-faint transition-colors hover:bg-raised hover:text-bright"
        >
          <MessageCircle size={13} strokeWidth={2.2} />
          <span className="tnum">{replies.length || ""}</span>
          {total > 0 && <span className="tnum text-accent">· {total}</span>}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2.5 flex flex-col gap-2 border-t border-line-soft pt-2.5">
              {replies.map((r) => (
                <div key={r.id} className="flex gap-2">
                  <Avatar initials={r.initials} color={r.color} size={22} />
                  <p className="min-w-0 flex-1 text-[13px] leading-snug">
                    <span className="font-bold">{r.username}</span>{" "}
                    <span className="text-bright/85">{r.text}</span>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

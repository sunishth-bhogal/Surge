"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLiveTick } from "@/components/live/live-provider";
import { Avatar, SentimentPill } from "@/components/ui/primitives";
import { currentUser } from "@/data/social";
import { compact } from "@/lib/format";
import { makeMessage, nextDelay, type ChatMessage } from "@/lib/chatter";
import type { LiveTick } from "@/lib/live-types";

const MAX = 60;

export function StockChat({ ticker, viewers }: { ticker: string; viewers: number }) {
  const tick = useLiveTick(ticker);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pinned, setPinned] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  // The scheduler reads the latest tape without re-subscribing on every tick,
  // so the ref is synced in an effect rather than during render.
  const tickRef = useRef<LiveTick | null>(tick);
  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  // Chatter is scheduled one message at a time, with the gap recomputed from
  // the live tape — so the room gets loud exactly when the price moves.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const current = tickRef.current;
      if (!current) {
        timer = setTimeout(schedule, 1500);
        return;
      }
      timer = setTimeout(() => {
        const t = tickRef.current;
        if (t) {
          setMessages((prev) => {
            const reply =
              prev.length > 0 && Math.random() < 0.28 ? prev[prev.length - 1].id : undefined;
            return [...prev, makeMessage(t, reply)].slice(-MAX);
          });
        }
        schedule();
      }, nextDelay(current));
    };

    schedule();
    return () => clearTimeout(timer);
  }, [ticker]);

  // Seed the room so it isn't empty on arrival.
  useEffect(() => {
    const t = tickRef.current;
    if (!t) return;
    setMessages(Array.from({ length: 4 }, () => makeMessage(t)));
  }, [ticker]);

  useEffect(() => {
    if (!pinned) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pinned]);

  function send() {
    const text = draft.trim();
    if (!text || !tick) return;
    const me = currentUser();
    setMessages((prev) =>
      [
        ...prev,
        {
          id: `me${Date.now()}`,
          userId: me.id,
          username: me.username,
          color: me.avatarColor,
          initials: me.initials,
          text,
          at: Date.now(),
          sentiment: "neutral" as const,
          self: true,
        },
      ].slice(-MAX),
    );
    setDraft("");
    setPinned(true);
  }

  return (
    <div className="overflow-hidden rounded-card border border-line-soft bg-surface">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold">
          <span className="live-dot size-1.5 rounded-full bg-up" />
          {ticker} room
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-faint">
          <Users size={12} strokeWidth={2.2} />
          <span className="tnum">{compact(viewers)}</span>
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
        }}
        className="flex h-[320px] flex-col gap-2.5 overflow-y-auto px-4 py-3"
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout="position"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-2.5"
            >
              <Avatar initials={m.initials} color={m.color} size={26} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[12.5px] font-bold ${m.self ? "text-accent" : ""}`}
                  >
                    {m.username}
                  </span>
                  {!m.self && m.sentiment !== "neutral" && (
                    <SentimentPill sentiment={m.sentiment} />
                  )}
                </div>
                <p className="text-[13.5px] leading-snug text-bright/90">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 border-t border-line-soft px-3 py-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={`Say something about ${ticker}`}
          aria-label={`Message the ${ticker} room`}
          className="min-w-0 flex-1 rounded-xl bg-raised px-3 py-2 text-[14px] text-bright placeholder:text-faint focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={!draft.trim()}
          aria-label="Send message"
          className={`grid size-9 shrink-0 place-items-center rounded-full transition-colors ${
            draft.trim() ? "bg-accent text-white hover:brightness-110" : "bg-raised text-faint"
          }`}
        >
          <ArrowUp size={17} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

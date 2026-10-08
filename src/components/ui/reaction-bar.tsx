"use client";

import { useState } from "react";
import { MessageCircle, Plus, Share, Bookmark } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { compact } from "@/lib/format";
import type { ReactionType } from "@/lib/types";

const GLYPH: Record<ReactionType, string> = {
  fire: "🔥",
  rocket: "🚀",
  eyes: "👀",
  laugh: "😂",
  skull: "💀",
  bull: "🐂",
  bear: "🐻",
};

const ORDER: ReactionType[] = ["fire", "rocket", "eyes", "bull", "bear", "laugh", "skull"];

export function ReactionBar({
  reactions,
  comments,
}: {
  reactions: Partial<Record<ReactionType, number>>;
  comments: number;
}) {
  const [mine, setMine] = useState<Partial<Record<ReactionType, boolean>>>({});
  const [picker, setPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  const shown = ORDER.filter((r) => reactions[r] !== undefined).slice(0, 3);
  const extra = ORDER.filter((r) => !shown.includes(r));

  function toggle(r: ReactionType) {
    setMine((m) => ({ ...m, [r]: !m[r] }));
    setPicker(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {shown.map((r) => {
        const count = (reactions[r] ?? 0) + (mine[r] ? 1 : 0);
        return (
          <button
            key={r}
            type="button"
            onClick={() => toggle(r)}
            aria-pressed={Boolean(mine[r])}
            aria-label={`React ${r}`}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold transition-colors ${
              mine[r]
                ? "bg-accent/18 text-accent"
                : "bg-raised text-muted hover:bg-hover hover:text-bright"
            }`}
          >
            <motion.span
              key={`${r}-${mine[r]}`}
              initial={mine[r] ? { scale: 0.6 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 16 }}
              className="text-[13px] leading-none"
            >
              {GLYPH[r]}
            </motion.span>
            <span className="tnum">{compact(count)}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPicker((p) => !p)}
          aria-label="More reactions"
          aria-expanded={picker}
          className="grid size-[27px] place-items-center rounded-lg bg-raised text-faint transition-colors hover:bg-hover hover:text-bright"
        >
          <Plus size={14} strokeWidth={2.4} />
        </button>
        <AnimatePresence>
          {picker && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="absolute bottom-full left-0 z-20 mb-2 flex gap-0.5 rounded-xl border border-line bg-raised p-1.5 shadow-2xl shadow-black/60"
            >
              {extra.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggle(r)}
                  aria-label={`React ${r}`}
                  className="grid size-8 place-items-center rounded-lg text-[16px] transition-transform hover:scale-115 hover:bg-hover"
                >
                  {GLYPH[r]}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
        <span className="flex items-center gap-1.5 px-2 py-1 text-[12.5px] font-medium text-faint">
          <MessageCircle size={14} strokeWidth={2.1} />
          <span className="tnum">{compact(comments)}</span>
        </span>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          aria-label="Save"
          className={`grid size-[27px] place-items-center rounded-lg transition-colors hover:bg-hover ${
            saved ? "text-accent" : "text-faint hover:text-bright"
          }`}
        >
          <Bookmark size={14} strokeWidth={2.1} fill={saved ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          aria-label="Share"
          className="grid size-[27px] place-items-center rounded-lg text-faint transition-colors hover:bg-hover hover:text-bright"
        >
          <Share size={14} strokeWidth={2.1} />
        </button>
      </div>
    </div>
  );
}

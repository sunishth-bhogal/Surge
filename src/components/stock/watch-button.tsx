"use client";

import { Check, Plus } from "lucide-react";
import { useAppState } from "@/components/app-state";

export function WatchButton({ ticker }: { ticker: string }) {
  const { isWatched, toggleWatch, ready } = useAppState();
  const watched = ready && isWatched(ticker);

  return (
    <button
      type="button"
      onClick={() => toggleWatch(ticker)}
      aria-pressed={watched}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        watched
          ? "bg-raised text-muted hover:bg-hover"
          : "bg-accent text-white hover:brightness-110"
      }`}
    >
      {watched ? <Check size={14} strokeWidth={2.8} /> : <Plus size={14} strokeWidth={2.8} />}
      {watched ? "Watching" : "Watch"}
    </button>
  );
}

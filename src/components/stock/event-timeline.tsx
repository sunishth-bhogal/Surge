import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Newspaper,
  Star,
  Sunrise,
  TrendingUp,
} from "lucide-react";
import { ReactionBar } from "@/components/ui/reaction-bar";
import { signedPercent } from "@/lib/format";
import type { MarketEvent, MarketEventType } from "@/lib/types";

const ICON: Record<MarketEventType, typeof Sunrise> = {
  open: Sunrise,
  breakout: ArrowUpRight,
  volume: BarChart3,
  high: TrendingUp,
  low: ArrowDownRight,
  analyst: Star,
  milestone: Bell,
  earnings: Bell,
  news: Newspaper,
};

const TONE: Record<MarketEventType, string> = {
  open: "text-muted",
  breakout: "text-up",
  volume: "text-accent",
  high: "text-up",
  low: "text-down",
  analyst: "text-accent",
  milestone: "text-up",
  earnings: "text-accent",
  news: "text-muted",
};

export function EventTimeline({ events }: { events: MarketEvent[] }) {
  return (
    <ol className="relative">
      <span
        aria-hidden
        className="absolute top-3 bottom-3 left-[19px] w-px bg-line-soft"
      />
      {events.map((event) => {
        const Icon = ICON[event.type];
        return (
          <li key={event.id} className="relative flex gap-3 pb-1">
            <span
              className={`z-10 mt-0.5 grid size-[38px] shrink-0 place-items-center rounded-full border border-line-soft bg-raised ${TONE[event.type]}`}
            >
              <Icon size={16} strokeWidth={2.3} />
            </span>

            <div className="min-w-0 flex-1 pb-4">
              <div className="flex items-center gap-2">
                <span className="tnum text-[12px] font-semibold text-faint">{event.time}</span>
                {event.changePercent !== undefined && (
                  <span
                    className="tnum text-[12px] font-semibold"
                    style={{
                      color: event.changePercent >= 0 ? "var(--color-up)" : "var(--color-down)",
                    }}
                  >
                    {signedPercent(event.changePercent)}
                  </span>
                )}
              </div>

              <h3 className="mt-1 text-[15.5px] leading-snug font-bold tracking-[-0.015em]">
                {event.headline}
              </h3>
              {event.detail && (
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{event.detail}</p>
              )}

              <div className="mt-2.5">
                <ReactionBar reactions={event.reactions} comments={event.comments} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

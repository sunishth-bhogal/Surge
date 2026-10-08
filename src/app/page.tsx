"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppState } from "@/components/app-state";
import { FeedCard } from "@/components/feed/feed-card";
import { IndexRail } from "@/components/markets/index-rail";
import { WatchlistRail } from "@/components/markets/watchlist-rail";
import { LiveTag } from "@/components/ui/primitives";
import { INDICES } from "@/data/social";
import { buildFeed } from "@/lib/feed";

export default function HomePage() {
  const { watchlist } = useAppState();
  const feed = useMemo(() => buildFeed(watchlist), [watchlist]);

  return (
    <main className="mx-auto max-w-xl px-4 pb-8">
      <header className="flex items-center justify-between pt-5 pb-4">
        <div>
          <h1 className="text-[28px] leading-none font-bold tracking-[-0.035em]">Splash</h1>
          <p className="mt-1.5 text-[12.5px] text-faint">Markets, live</p>
        </div>
        <div className="flex items-center gap-2">
          <LiveTag label="Market open" />
        </div>
      </header>

      <IndexRail indices={INDICES} />

      <section className="mt-6">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <h2 className="text-[13px] font-bold tracking-[0.1em] text-faint uppercase">
            Your watchlist
          </h2>
          <Link href="/profile" className="text-[12.5px] font-medium text-accent hover:underline">
            Edit
          </Link>
        </div>
        {watchlist.length > 0 ? (
          <WatchlistRail tickers={watchlist} />
        ) : (
          <Link
            href="/welcome"
            className="block rounded-card border border-dashed border-line px-4 py-5 text-center text-[13.5px] text-faint transition-colors hover:border-faint/60"
          >
            Pick a few stocks to personalize your feed
          </Link>
        )}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center gap-2 px-1">
          <h2 className="text-[19px] font-bold tracking-[-0.02em]">Happening now</h2>
          <span className="live-dot size-1.5 rounded-full bg-down" />
        </div>
        <div className="flex flex-col gap-3">
          {feed.map((item, i) => (
            <div key={item.id} className="rise" style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}>
              <FeedCard item={item} />
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 px-2 text-center text-[11.5px] leading-relaxed text-faint/80">
        Information on Splash is for informational and entertainment purposes only and is not
        financial advice.
      </p>
    </main>
  );
}

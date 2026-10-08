import { notFound } from "next/navigation";
import { Users } from "lucide-react";
import { TopBar } from "@/components/chrome/top-bar";
import { Community } from "@/components/stock/community";
import { EventTimeline } from "@/components/stock/event-timeline";
import { WatchButton } from "@/components/stock/watch-button";
import { PriceChart } from "@/components/ui/price-chart";
import {
  Card,
  Delta,
  Eyebrow,
  LiveTag,
  SectionHeader,
  Stat,
  TickerBadge,
} from "@/components/ui/primitives";
import { POSTS, PREDICTIONS, TRENDING } from "@/data/social";
import { STOCKS } from "@/data/stocks";
import { compact, marketCap, price } from "@/lib/format";
import { marketData } from "@/lib/market";
import { buildSeries } from "@/lib/series";
import { crowdLine, moveHeadline, volumeLine } from "@/lib/storyline";
import type { PricePoint, Range } from "@/lib/types";

const RANGES: Range[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];

export function generateStaticParams() {
  return STOCKS.map((s) => ({ ticker: s.ticker }));
}

export default async function StockPage({ params }: PageProps<"/stock/[ticker]">) {
  const { ticker: raw } = await params;
  const ticker = raw.toUpperCase();

  const [stock, quote, events, news] = await Promise.all([
    marketData.getStock(ticker),
    marketData.getQuote(ticker),
    marketData.getMarketEvents(ticker),
    marketData.getCompanyNews(ticker),
  ]);
  if (!stock || !quote) notFound();

  const series = Object.fromEntries(
    RANGES.map((r) => [r, buildSeries(ticker, r).points]),
  ) as Record<Range, PricePoint[]>;

  const buzz = TRENDING.find((t) => t.ticker === ticker);
  const posts = POSTS.filter((p) => p.ticker === ticker);
  const predictions = PREDICTIONS.filter((p) => p.ticker === ticker);
  const afterHours = quote.afterHoursChangePercent !== undefined;

  return (
    <>
      <TopBar
        title={ticker}
        subtitle={stock.companyName}
        back="/markets"
        right={<WatchButton ticker={ticker} />}
      />

      <main className="mx-auto max-w-xl px-4 pb-8">
        <section className="flex items-center gap-3 pt-5">
          <TickerBadge ticker={ticker} color={stock.logoColor} size={44} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] leading-tight font-bold tracking-[-0.025em]">
              {moveHeadline(ticker, quote.changePercent)}
            </h2>
            <p className="truncate text-[13px] text-faint">
              {buzz
                ? `${compact(buzz.activeViewers)} watching · ${compact(buzz.posts)} posts today`
                : stock.sector}
            </p>
          </div>
        </section>

        <section className="mt-5">
          <PriceChart series={series} previousClose={quote.previousClose} />
        </section>

        {afterHours && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-line-soft bg-surface px-3.5 py-2.5">
            <LiveTag label="After hours" />
            <span className="tnum text-[15px] font-bold">{price(quote.afterHoursPrice!)}</span>
            <Delta value={quote.afterHoursChangePercent!} showBg={false} />
          </div>
        )}

        <section className="mt-5">
          <Card className="grid grid-cols-3 gap-y-4 px-4 py-4">
            <Stat label="Market cap" value={marketCap(quote.marketCap)} />
            <Stat label="P/E" value={quote.peRatio ? quote.peRatio.toFixed(1) : "—"} />
            <Stat label="Volume" value={compact(quote.volume)} />
            <Stat label="52w high" value={price(quote.week52High)} />
            <Stat label="52w low" value={price(quote.week52Low)} />
            <Stat label="Avg volume" value={compact(quote.avgVolume)} />
          </Card>
          <p className="mt-2.5 px-1 text-[12.5px] text-faint">
            {volumeLine(quote.volume, quote.avgVolume)}
            {buzz ? ` · ${crowdLine(buzz.bullishShare)}` : ""}.
          </p>
        </section>

        {events.length > 0 && (
          <section className="mt-7">
            <div className="mb-3 flex items-baseline justify-between px-1">
              <h2 className="text-[19px] font-bold tracking-[-0.02em]">Today&apos;s timeline</h2>
              <Eyebrow>{events.length} events</Eyebrow>
            </div>
            <Card className="px-4 pt-4 pb-1">
              <EventTimeline events={events} />
            </Card>
          </section>
        )}

        <section className="mt-7">
          <SectionHeader title={`${ticker} community`} />
          {buzz && (
            <div className="mb-3 flex items-center gap-2 px-1 text-[12.5px] text-faint">
              <Users size={13} strokeWidth={2.2} />
              <span className="tnum">{compact(buzz.activeViewers)} people here right now</span>
            </div>
          )}
          <Community stock={stock} posts={posts} predictions={predictions} news={news} />
        </section>

        <p className="mt-8 px-2 text-center text-[11.5px] leading-relaxed text-faint/80">
          Information on Splash is for informational and entertainment purposes only and is not
          financial advice.
        </p>
      </main>
    </>
  );
}

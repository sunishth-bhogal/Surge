import Link from "next/link";
import { ArrowUpRight, Flame, Users } from "lucide-react";
import {
  Card,
  Delta,
  Eyebrow,
  LiveTag,
  TickerBadge,
} from "@/components/ui/primitives";
import { PredictionCard } from "@/components/feed/prediction-card";
import { ReactionBar } from "@/components/ui/reaction-bar";
import { Sparkline } from "@/components/ui/sparkline";
import { compact, price } from "@/lib/format";
import { buildSpark } from "@/lib/series";
import { crowdLine, moveHeadline, volumeLine } from "@/lib/storyline";
import type { FeedItem, Stock } from "@/lib/types";

function CardHead({
  stock,
  meta,
  eyebrow,
}: {
  stock: Stock;
  meta: string;
  eyebrow?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Link href={`/stock/${stock.ticker}`} aria-label={stock.companyName}>
        <TickerBadge ticker={stock.ticker} color={stock.logoColor} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/stock/${stock.ticker}`}
            className="text-[14.5px] font-bold tracking-[-0.01em] transition-colors hover:text-accent"
          >
            {stock.ticker}
          </Link>
          {eyebrow}
        </div>
        <p className="truncate text-[12px] text-faint">{meta}</p>
      </div>
    </div>
  );
}

export function FeedCard({ item }: { item: FeedItem }) {
  if (item.kind === "prediction") {
    return <PredictionCard prediction={item.prediction} stock={item.stock} />;
  }

  if (item.kind === "price") {
    const { event, quote, stock } = item;
    return (
      <Card as="article" className="p-4">
        <CardHead
          stock={stock}
          meta={`${stock.companyName} · ${event.time}`}
          eyebrow={<Delta value={quote.changePercent} />}
        />

        <h3 className="mt-3 text-[20px] leading-tight font-bold tracking-[-0.025em]">
          {moveHeadline(stock.ticker, quote.changePercent)}
        </h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
          {event.detail ?? event.headline}
        </p>

        <div className="mt-3.5 flex items-end justify-between gap-3">
          <div>
            <div className="tnum text-[22px] leading-none font-bold tracking-[-0.03em]">
              {price(quote.price)}
            </div>
            <p className="mt-1.5 text-[12px] text-faint">
              {volumeLine(quote.volume, quote.avgVolume)}
            </p>
          </div>
          <Sparkline
            points={buildSpark(stock.ticker, "1D", 28)}
            positive={quote.changePercent >= 0}
            width={96}
            height={34}
          />
        </div>

        <div className="mt-3.5 border-t border-line-soft pt-3">
          <ReactionBar reactions={event.reactions} comments={event.comments} />
        </div>
      </Card>
    );
  }

  if (item.kind === "news") {
    const { news, quote, stock } = item;
    return (
      <Card as="article" className="p-4">
        <CardHead
          stock={stock}
          meta={`${news.source} · ${news.publishedAt}`}
          eyebrow={<Delta value={quote.changePercent} />}
        />
        <h3 className="mt-3 text-[17px] leading-snug font-bold tracking-[-0.02em]">
          {news.headline}
        </h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{news.summary}</p>
        <Link
          href={`/stock/${stock.ticker}`}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
        >
          Read more
          <ArrowUpRight size={14} strokeWidth={2.4} />
        </Link>
        <div className="mt-3.5 border-t border-line-soft pt-3">
          <ReactionBar reactions={{ eyes: 1_180, fire: 740, bull: 410 }} comments={263} />
        </div>
      </Card>
    );
  }

  if (item.kind === "earnings") {
    const { earnings, quote, stock } = item;
    const live = Boolean(earnings.isLive);
    return (
      <Card
        as="article"
        className={`overflow-hidden p-4 ${live ? "border-down/35" : ""}`}
      >
        <CardHead
          stock={stock}
          meta={`${earnings.dayLabel} · ${earnings.session}`}
          eyebrow={live ? <LiveTag /> : <Eyebrow>Earnings</Eyebrow>}
        />

        <h3 className="mt-3 text-[20px] leading-tight font-bold tracking-[-0.025em]">
          {live
            ? `${stock.ticker} earnings are live`
            : `${stock.ticker} reports ${earnings.dayLabel.toLowerCase()}`}
        </h3>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
          {live
            ? "Revenue came in ahead of expectations. The call starts at 4:30 PM."
            : `The street is looking for ${earnings.expectedRevenue} in revenue and $${earnings.expectedEps.toFixed(2)} a share.`}
        </p>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-raised px-3 py-2.5">
            <p className="text-[11px] font-medium text-faint">
              {live ? "Revenue" : "Expected revenue"}
            </p>
            <p className="tnum mt-0.5 text-[15px] font-bold">
              {live ? "$54.1B" : earnings.expectedRevenue}
            </p>
          </div>
          <div className="rounded-xl bg-raised px-3 py-2.5">
            <p className="text-[11px] font-medium text-faint">Expected</p>
            <p className="tnum mt-0.5 text-[15px] font-bold text-faint">
              {earnings.expectedRevenue}
            </p>
          </div>
        </div>

        {live && quote.afterHoursChangePercent !== undefined && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-up/8 px-3 py-2.5">
            <span className="tnum text-[15px] font-bold">{price(quote.afterHoursPrice!)}</span>
            <Delta value={quote.afterHoursChangePercent} showBg={false} />
            <span className="text-[12px] text-faint">after hours</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-faint">
          <Users size={13} strokeWidth={2.2} />
          <span className="tnum">{compact(earnings.followers)} Splash users following</span>
        </div>

        <div className="mt-3.5 border-t border-line-soft pt-3">
          <ReactionBar
            reactions={live ? { fire: 3_140, rocket: 2_210, eyes: 1_420 } : { eyes: 2_410, fire: 880 }}
            comments={live ? 744 : 192}
          />
        </div>
      </Card>
    );
  }

  const { trending, rank, stock } = item;
  return (
    <Card as="article" className="p-4">
      <CardHead
        stock={stock}
        meta={stock.companyName}
        eyebrow={<Delta value={trending.changePercent} />}
      />
      <h3 className="mt-3 flex items-center gap-1.5 text-[18px] leading-tight font-bold tracking-[-0.02em]">
        <Flame size={17} strokeWidth={2.4} className="text-accent" />
        {stock.ticker} is trending #{rank} on Splash
      </h3>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">
        {compact(trending.activeViewers)} people watching it right now. {crowdLine(trending.bullishShare)}.
      </p>
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-down/25">
        <div
          className="h-full rounded-full bg-up"
          style={{ width: `${Math.round(trending.bullishShare * 100)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11.5px] font-semibold">
        <span className="text-up">{Math.round(trending.bullishShare * 100)}% bullish</span>
        <span className="text-down">{100 - Math.round(trending.bullishShare * 100)}% bearish</span>
      </div>
      <div className="mt-3.5 border-t border-line-soft pt-3">
        <ReactionBar reactions={{ fire: 1_640, eyes: 920, bull: 520 }} comments={trending.posts} />
      </div>
    </Card>
  );
}

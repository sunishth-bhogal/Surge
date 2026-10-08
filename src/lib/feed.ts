import { QUOTES, STOCKS } from "@/data/stocks";
import { EARNINGS, EVENTS, NEWS, PREDICTIONS, TRENDING } from "@/data/social";
import type { FeedItem } from "@/lib/types";

const stockOf = (ticker: string) => STOCKS.find((s) => s.ticker === ticker)!;

/**
 * Builds the home feed. Ranking is deliberately simple: a hand-tuned weight per
 * item kind, lifted for anything on the viewer's watchlist, then interleaved so
 * two cards of the same kind never land next to each other.
 */
export function buildFeed(watchlist: string[]): FeedItem[] {
  const follows = new Set(watchlist);
  const items: { item: FeedItem; score: number }[] = [];

  const headline = EVENTS.filter((e) =>
    ["milestone", "high", "low", "breakout", "earnings"].includes(e.type),
  );
  for (const event of headline) {
    const quote = QUOTES[event.ticker];
    if (!quote) continue;
    const engagement = Object.values(event.reactions).reduce((a, b) => a + b, 0) + event.comments * 3;
    items.push({
      item: { kind: "price", id: `f-${event.id}`, event, quote, stock: stockOf(event.ticker) },
      score: engagement / 100 + Math.abs(event.changePercent ?? 0) * 6 + (follows.has(event.ticker) ? 70 : 0),
    });
  }

  for (const news of NEWS.slice(0, 5)) {
    const quote = QUOTES[news.ticker];
    if (!quote) continue;
    items.push({
      item: { kind: "news", id: `f-${news.id}`, news, quote, stock: stockOf(news.ticker) },
      score: 60 - news.minutesAgo / 6 + (follows.has(news.ticker) ? 70 : 0),
    });
  }

  for (const prediction of PREDICTIONS.slice(0, 4)) {
    items.push({
      item: { kind: "prediction", id: `f-${prediction.id}`, prediction, stock: stockOf(prediction.ticker) },
      score: prediction.totalPredictions / 70 + (follows.has(prediction.ticker) ? 70 : 0),
    });
  }

  for (const earnings of EARNINGS.slice(0, 2)) {
    const quote = QUOTES[earnings.ticker];
    if (!quote) continue;
    items.push({
      item: { kind: "earnings", id: `f-${earnings.id}`, earnings, quote, stock: stockOf(earnings.ticker) },
      score: (earnings.isLive ? 200 : 80) + (follows.has(earnings.ticker) ? 70 : 0),
    });
  }

  TRENDING.slice(0, 3).forEach((trending, i) => {
    items.push({
      item: { kind: "buzz", id: `f-buzz-${trending.ticker}`, trending, rank: i + 1, stock: stockOf(trending.ticker) },
      score: trending.posts / 40 + (follows.has(trending.ticker) ? 70 : 0),
    });
  });

  const ranked = items.sort((a, b) => b.score - a.score).map((r) => r.item);

  const out: FeedItem[] = [];
  const held: FeedItem[] = [];
  for (const item of ranked) {
    if (out.length && out[out.length - 1].kind === item.kind) held.push(item);
    else out.push(item);
    const i = held.findIndex((h) => h.kind !== out[out.length - 1].kind);
    if (i !== -1) out.push(...held.splice(i, 1));
  }
  return [...out, ...held];
}

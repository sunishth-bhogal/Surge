"use client";

import { useState } from "react";
import { ArrowUpRight, PenLine } from "lucide-react";
import { PostCard } from "@/components/social/post-card";
import { PredictionCard } from "@/components/feed/prediction-card";
import { Card } from "@/components/ui/primitives";
import { ago } from "@/lib/format";
import type { NewsItem, Post, Prediction, Stock } from "@/lib/types";

const TABS = ["Live", "Top", "Predictions", "News"] as const;
type Tab = (typeof TABS)[number];

export function Community({
  stock,
  posts,
  predictions,
  news,
}: {
  stock: Stock;
  posts: Post[];
  predictions: Prediction[];
  news: NewsItem[];
}) {
  const [tab, setTab] = useState<Tab>("Live");

  const live = [...posts].sort((a, b) => a.minutesAgo - b.minutesAgo);
  const top = [...posts].sort((a, b) => b.likes + b.comments * 2 - (a.likes + a.comments * 2));

  return (
    <section>
      <div className="sticky top-[57px] z-20 -mx-4 bg-ink/90 px-4 pt-1 pb-3 backdrop-blur-xl">
        <div className="flex gap-1 rounded-xl bg-raised p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-pressed={t === tab}
              className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
                t === tab ? "bg-hover text-bright" : "text-faint hover:text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {(tab === "Live" || tab === "Top") && (
        <>
          <button
            type="button"
            className="mb-3 flex w-full items-center gap-2.5 rounded-card border border-line-soft bg-surface px-4 py-3 text-left text-[14px] text-faint transition-colors hover:border-faint/40"
          >
            <PenLine size={15} strokeWidth={2.2} />
            What are you seeing in {stock.ticker}?
          </button>
          {posts.length ? (
            <Card className="divide-y divide-line-soft">
              {(tab === "Live" ? live : top).map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </Card>
          ) : (
            <Empty
              text={`No posts on ${stock.ticker} yet — the live room above is where the talking is happening.`}
            />
          )}
        </>
      )}

      {tab === "Predictions" && (
        <div className="flex flex-col gap-3">
          {predictions.length ? (
            predictions.map((prediction) => (
              <PredictionCard
                key={prediction.id}
                prediction={prediction}
                stock={stock}
                compactMode
              />
            ))
          ) : (
            <Empty text={`No open predictions on ${stock.ticker} right now.`} />
          )}
          <p className="px-2 text-center text-[11.5px] leading-relaxed text-faint/80">
            Predictions award reputation only. They are community forecasting, not wagers, and
            not financial advice.
          </p>
        </div>
      )}

      {tab === "News" && (
        <Card className="divide-y divide-line-soft">
          {news.length ? (
            news.map((item) => (
              <a key={item.id} href="#" className="block px-4 py-3.5 transition-colors hover:bg-raised">
                <div className="flex items-center gap-2 text-[11.5px] text-faint">
                  <span className="font-semibold text-muted">{item.source}</span>
                  <span>·</span>
                  <span>{ago(item.minutesAgo)} ago</span>
                </div>
                <h3 className="mt-1 text-[15px] leading-snug font-bold tracking-[-0.015em]">
                  {item.headline}
                </h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{item.summary}</p>
                <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent">
                  Read more
                  <ArrowUpRight size={13} strokeWidth={2.4} />
                </span>
              </a>
            ))
          ) : (
            <Empty text={`Nothing new on ${stock.ticker} today.`} />
          )}
        </Card>
      )}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-card border border-dashed border-line px-4 py-8 text-center text-[13.5px] text-faint">
      {text}
    </div>
  );
}

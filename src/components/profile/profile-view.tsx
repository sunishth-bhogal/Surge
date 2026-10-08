import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { PostCard } from "@/components/social/post-card";
import { WatchlistEditor } from "@/components/profile/watchlist-editor";
import {
  Avatar,
  Card,
  Delta,
  SectionHeader,
  TickerBadge,
} from "@/components/ui/primitives";
import { POSTS, RESOLVED_PREDICTIONS } from "@/data/social";
import { STOCKS } from "@/data/stocks";
import { deriveQuote } from "@/lib/quote-engine";
import { compact } from "@/lib/format";
import type { User } from "@/lib/types";

const LEVELS = ["Rookie", "Trader", "Analyst", "Strategist", "Oracle"] as const;

export function ProfileView({ user, isSelf }: { user: User; isSelf: boolean }) {
  const posts = POSTS.filter((p) => p.authorId === user.id).slice(0, 4);
  const levelIndex = LEVELS.indexOf(user.level);

  return (
    <main className="mx-auto max-w-xl px-4 pb-8">
      <section className="flex items-start gap-4 pt-5">
        <Avatar initials={user.initials} color={user.avatarColor} size={64} />
        <div className="min-w-0 flex-1">
          <h2 className="text-[20px] leading-tight font-bold tracking-[-0.025em]">
            {user.displayName}
          </h2>
          <p className="text-[13.5px] text-faint">@{user.username}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{user.bio}</p>
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-accent/14 px-2.5 py-1 text-[12px] font-bold text-accent">
          <Trophy size={12} strokeWidth={2.6} />
          {user.level}
        </span>
        {user.streak > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1 text-[12px] font-semibold text-muted">
            <Flame size={12} strokeWidth={2.6} className="text-accent" />
            {user.streak} day streak
          </span>
        )}
        {!isSelf && (
          <button
            type="button"
            className="ml-auto rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110"
          >
            Follow
          </button>
        )}
      </div>

      <Card className="mt-4 grid grid-cols-3 divide-x divide-line-soft">
        {[
          { label: "Karma", value: compact(user.karma) },
          { label: "Followers", value: compact(user.followers) },
          { label: "Following", value: compact(user.following) },
        ].map((stat) => (
          <div key={stat.label} className="px-3 py-3.5 text-center">
            <p className="tnum text-[18px] leading-none font-bold tracking-[-0.025em]">
              {stat.value}
            </p>
            <p className="mt-1.5 text-[11.5px] font-medium text-faint">{stat.label}</p>
          </div>
        ))}
      </Card>

      <section className="mt-7">
        <SectionHeader title="Predictions" />
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="tnum text-[32px] leading-none font-bold tracking-[-0.03em]">
                {user.predictionAccuracy}%
              </p>
              <p className="mt-1.5 text-[13px] text-faint">
                correct across {compact(user.predictionsMade)} predictions
              </p>
            </div>
            <span className="rounded-lg bg-up/12 px-2 py-1 text-[12px] font-bold text-up">
              Top {user.percentile}%
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 border-t border-line-soft pt-4">
            {user.bestCategories.map((category) => (
              <div key={category.ticker} className="flex items-center gap-3">
                <Link
                  href={`/stock/${category.ticker}`}
                  className="w-12 shrink-0 text-[13px] font-bold transition-colors hover:text-accent"
                >
                  {category.ticker}
                </Link>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-hover">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${category.accuracy}%` }}
                  />
                </span>
                <span className="tnum w-9 shrink-0 text-right text-[12.5px] font-semibold text-muted">
                  {category.accuracy}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-3 flex gap-1 px-1">
          {LEVELS.map((level, i) => (
            <span
              key={level}
              className={`h-1 flex-1 rounded-full ${i <= levelIndex ? "bg-accent" : "bg-hover"}`}
              title={level}
            />
          ))}
        </div>
        <p className="mt-2 px-1 text-[11.5px] text-faint">
          {user.level} · {levelIndex < LEVELS.length - 1
            ? `${LEVELS[levelIndex + 1]} unlocks at higher sustained accuracy`
            : "Highest reputation level"}
        </p>
      </section>

      <section className="mt-7">
        <SectionHeader title="Watchlist" />
        {isSelf ? (
          <WatchlistEditor />
        ) : (
          <Card className="divide-y divide-line-soft">
            {user.watchlist.map((ticker) => {
              const stock = STOCKS.find((s) => s.ticker === ticker);
              const quote = deriveQuote(ticker);
              return (
                <Link
                  key={ticker}
                  href={`/stock/${ticker}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
                >
                  <TickerBadge ticker={ticker} color={stock?.logoColor ?? "#3d7dff"} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold">{ticker}</p>
                    <p className="truncate text-[12px] text-faint">{stock?.companyName ?? ticker}</p>
                  </div>
                  <Delta value={quote.changePercent} />
                </Link>
              );
            })}
          </Card>
        )}
      </section>

      <section className="mt-7">
        <SectionHeader title="Recent predictions" />
        <Card className="divide-y divide-line-soft">
          {RESOLVED_PREDICTIONS.map((prediction) => (
            <div key={prediction.id} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] leading-snug font-semibold">{prediction.question}</p>
                  <p className="mt-1 text-[12.5px] text-faint">{prediction.resolved?.outcome}</p>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-[11.5px] font-bold ${
                    prediction.resolved?.correct ? "bg-up/12 text-up" : "bg-down/12 text-down"
                  }`}
                >
                  {prediction.resolved?.correct ? "Correct" : "Missed"}
                </span>
              </div>
            </div>
          ))}
        </Card>
      </section>

      {posts.length > 0 && (
        <section className="mt-7">
          <SectionHeader title="Recent posts" />
          <Card className="divide-y divide-line-soft">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} showTicker />
            ))}
          </Card>
        </section>
      )}

      <p className="mt-8 px-2 text-center text-[11.5px] leading-relaxed text-faint/80">
        Prediction records reflect community forecasting only. Nothing on Splash is financial
        advice.
      </p>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X } from "lucide-react";
import { StockRow } from "@/components/markets/stock-row";
import { Avatar, Card, SectionHeader, TickerBadge } from "@/components/ui/primitives";
import { Delta } from "@/components/ui/primitives";
import { QUOTES, STOCKS } from "@/data/stocks";
import { TRENDING, USERS } from "@/data/social";
import { compact, price } from "@/lib/format";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const { stocks, users } = useMemo(() => {
    if (!q) return { stocks: [], users: [] };
    return {
      stocks: STOCKS.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q),
      ),
      users: USERS.filter(
        (u) =>
          u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q),
      ),
    };
  }, [q]);

  const empty = q.length > 0 && stocks.length === 0 && users.length === 0;

  return (
    <main className="mx-auto max-w-xl px-4 pb-8">
      <div className="sticky top-0 z-30 -mx-4 bg-ink/90 px-4 pt-5 pb-3 backdrop-blur-xl">
        <label className="flex items-center gap-2.5 rounded-2xl border border-line-soft bg-surface px-3.5 py-2.5 focus-within:border-accent/50">
          <SearchIcon size={17} strokeWidth={2.2} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies, tickers, people"
            aria-label="Search"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-bright placeholder:text-faint focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="grid size-5 shrink-0 place-items-center rounded-full bg-hover text-faint hover:text-bright"
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </label>
      </div>

      {!q && (
        <>
          <section className="mt-4">
            <SectionHeader title="Trending now" />
            <Card className="divide-y divide-line-soft">
              {TRENDING.slice(0, 6).map((row, i) => (
                <StockRow key={row.ticker} row={row} rank={i + 1} showBuzz />
              ))}
            </Card>
          </section>

          <section className="mt-7">
            <SectionHeader title="Top predictors to follow" />
            <Card className="divide-y divide-line-soft">
              {USERS.filter((u) => u.id !== "u1")
                .slice(0, 4)
                .map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
                  >
                    <Avatar initials={user.initials} color={user.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold tracking-[-0.01em]">
                        {user.username}
                      </p>
                      <p className="truncate text-[12px] text-faint">
                        {user.level} · {user.predictionAccuracy}% correct ·{" "}
                        {compact(user.followers)} followers
                      </p>
                    </div>
                    <span className="tnum shrink-0 rounded-lg bg-raised px-2 py-1 text-[12px] font-semibold text-muted">
                      {compact(user.karma)}
                    </span>
                  </Link>
                ))}
            </Card>
          </section>
        </>
      )}

      {stocks.length > 0 && (
        <section className="mt-4">
          <SectionHeader title="Companies" />
          <Card className="divide-y divide-line-soft">
            {stocks.map((stock) => {
              const quote = QUOTES[stock.ticker];
              return (
                <Link
                  key={stock.id}
                  href={`/stock/${stock.ticker}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
                >
                  <TickerBadge ticker={stock.ticker} color={stock.logoColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-bold tracking-[-0.01em]">{stock.ticker}</p>
                    <p className="truncate text-[12px] text-faint">{stock.companyName}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-[14px] font-semibold">{price(quote.price)}</p>
                    <div className="mt-0.5 flex justify-end">
                      <Delta value={quote.changePercent} showBg={false} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </Card>
        </section>
      )}

      {users.length > 0 && (
        <section className="mt-6">
          <SectionHeader title="People" />
          <Card className="divide-y divide-line-soft">
            {users.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
              >
                <Avatar initials={user.initials} color={user.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold tracking-[-0.01em]">{user.username}</p>
                  <p className="truncate text-[12px] text-faint">{user.displayName} · {user.level}</p>
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {empty && (
        <p className="mt-10 text-center text-[14px] text-faint">
          Nothing matched &ldquo;{query}&rdquo;.
        </p>
      )}
    </main>
  );
}

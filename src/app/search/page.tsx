"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search as SearchIcon, X } from "lucide-react";
import { StockRow } from "@/components/markets/stock-row";
import { Avatar, Card, Delta, SectionHeader } from "@/components/ui/primitives";
import { TRENDING, USERS } from "@/data/social";
import { compact, price } from "@/lib/format";

interface Hit {
  ticker: string;
  name: string;
  exchange: string;
  isEtf: boolean;
  price: number;
  changePercent: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const q = query.trim();

  const people = useMemo(() => {
    if (!q) return [];
    const needle = q.toLowerCase();
    return USERS.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) ||
        u.displayName.toLowerCase().includes(needle),
    );
  }, [q]);

  // Debounced so a fast typist fires one request, not eight. The empty-query
  // reset happens in the change handler, not here, so this effect only ever
  // talks to the network.
  useEffect(() => {
    if (!q) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((d: { results: Hit[] }) => {
          setHits(d.results);
          setLoading(false);
        })
        .catch(() => {
          /* aborted or offline — keep the previous results on screen */
        });
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const empty = q.length > 0 && !loading && hits.length === 0 && people.length === 0;

  return (
    <main className="mx-auto max-w-xl px-4 pb-8">
      <div className="sticky top-0 z-30 -mx-4 bg-ink/90 px-4 pt-5 pb-3 backdrop-blur-xl">
        <label className="flex items-center gap-2.5 rounded-2xl border border-line-soft bg-surface px-3.5 py-2.5 focus-within:border-accent/50">
          <SearchIcon size={17} strokeWidth={2.2} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              if (next.trim()) {
                setLoading(true);
              } else {
                setHits([]);
                setLoading(false);
              }
            }}
            placeholder="Search 12,874 symbols, companies, people"
            aria-label="Search"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-bright placeholder:text-faint focus:outline-none"
          />
          {loading && <Loader2 size={15} className="shrink-0 animate-spin text-faint" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setHits([]);
                setLoading(false);
              }}
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
                      <p className="text-[14.5px] font-bold tracking-[-0.01em]">{user.username}</p>
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

      {hits.length > 0 && (
        <section className="mt-4">
          <SectionHeader title="Symbols" />
          <Card className="divide-y divide-line-soft">
            {hits.map((hit) => (
              <Link
                key={hit.ticker}
                href={`/stock/${encodeURIComponent(hit.ticker)}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[14.5px] font-bold tracking-[-0.01em]">
                    {hit.ticker}
                    {hit.isEtf && (
                      <span className="rounded bg-raised px-1 py-0.5 text-[9.5px] font-bold text-faint">
                        ETF
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[12px] text-faint">
                    {hit.name} · {hit.exchange}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-[14px] font-semibold">{price(hit.price)}</p>
                  <div className="mt-0.5 flex justify-end">
                    <Delta value={hit.changePercent} showBg={false} />
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}

      {people.length > 0 && (
        <section className="mt-6">
          <SectionHeader title="People" />
          <Card className="divide-y divide-line-soft">
            {people.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
              >
                <Avatar initials={user.initials} color={user.avatarColor} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold tracking-[-0.01em]">{user.username}</p>
                  <p className="truncate text-[12px] text-faint">
                    {user.displayName} · {user.level}
                  </p>
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

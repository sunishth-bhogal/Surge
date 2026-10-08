# Splash

The social layer for the stock market. Markets, live.

A front-end prototype of a consumer social product for following the market together —
live prices, market events you can react to, community predictions and reputation.
Everything runs on mock data behind a provider interface, so a real market-data API can be
dropped in without touching the UI.

## Running it

```bash
npm run dev
```

Then open http://localhost:3200 (the dev script defaults to 3000; the preview config passes
`--port 3200`).

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

> **Note on the scripts.** This project sits under a directory whose name contains a `:`.
> npm prepends `node_modules/.bin` to `PATH`, and `PATH` is colon-separated, so that entry
> gets split in half and every binary becomes "command not found". The scripts therefore
> invoke `node ./node_modules/<pkg>/…` directly. Move the project to a path without a colon
> and the conventional `next dev` form works again.

## Routes

| Route | Rendering | What it is |
| --- | --- | --- |
| `/` | client | Home feed — indices, watchlist rail, ranked event feed |
| `/welcome` | client | Onboarding: auth choice, then pick ≥5 stocks |
| `/markets` | server | Indices, trending, movers, earnings calendar, sector read |
| `/stock/[ticker]` | SSG (9) | Stock page: chart, stats, event timeline, community |
| `/search` | client | Global search over companies, tickers and people |
| `/notifications` | server | Grouped new/earlier alerts |
| `/profile` | server | Signed-in profile with an editable watchlist |
| `/profile/[username]` | SSG (6) | Other users' profiles |

Navigation is a persistent bottom tab bar (`Home · Markets · Search · Alerts · Profile`).
`/welcome` renders without it.

## Component structure

```
src/
  app/                       routes (see table above)
  components/
    app-state.tsx            watchlist + onboarding store (useSyncExternalStore)
    chrome/
      app-shell.tsx          decides whether the tab bar shows
      bottom-nav.tsx         tab bar with unread badge
      top-bar.tsx            sticky header (title, subtitle, back, right slot)
    feed/
      feed-card.tsx          renders any FeedItem variant
      prediction-card.tsx    interactive poll with animated share bars
    markets/
      index-rail.tsx         scrollable index cards
      watchlist-rail.tsx     scrollable watchlist cards
      stock-row.tsx          list row (rank, sparkline, price, sentiment bar)
      movers.tsx             Gainers / Losers / Most Active tabs
    profile/
      profile-view.tsx       shared by both profile routes
      watchlist-editor.tsx   add/remove, persisted to localStorage
    social/post-card.tsx     community post with sentiment + like
    stock/
      community.tsx          Live / Top / Predictions / News tabs
      event-timeline.tsx     reactable market-event timeline
      watch-button.tsx       watch toggle
    ui/
      primitives.tsx         Card, Delta, TickerBadge, Avatar, LiveTag, Stat, …
      price-chart.tsx        scrubbable area chart with range tabs
      sparkline.tsx          inline mini chart
      reaction-bar.tsx       emoji reactions, picker, save, share
  data/
    stocks.ts                9 tickers + quotes
    social.ts                users, posts, events, predictions, news, earnings
  lib/
    types.ts                 all data models + MarketDataProvider
    market.ts                selects the active provider
    providers/mock.ts        the mock implementation
    series.ts                seeded price-series generator
    feed.ts                  home-feed ranking + interleaving
    format.ts                price/percent/compact/relative-time helpers
    storyline.ts             the "story, not the number" headline voice
```

## Data models

Defined in `src/lib/types.ts`, shaped to match the intended Postgres schema:

- `Stock`, `Quote`, `Series` / `PricePoint`, `MarketIndex`
- `TrendingStock` — adds `activeViewers`, `posts`, `bullishShare` (the social layer)
- `MarketEvent` — the differentiator: a typed, timestamped, reactable moment
- `User` with karma, level, prediction accuracy, streak, percentile
- `Post`, `Prediction`, `NewsItem`, `EarningsEntry`, `Notification`
- `FeedItem` — a discriminated union (`price | news | prediction | earnings | buzz`)
  so the feed can grow new card kinds without `any`

## API abstraction

`MarketDataProvider` in `src/lib/types.ts` is the single seam to the outside world:

```ts
getQuote(ticker)            getHistoricalPrices(ticker, range)
getQuotes(tickers)          getTrendingStocks()
getMarketIndices()          getCompanyNews(ticker?)
getEarningsCalendar()       getMarketEvents(ticker?)
getStock(ticker)            searchStocks(query)
getMovers(kind)
```

`src/lib/market.ts` picks the implementation; `src/lib/providers/mock.ts` is the only one
today. To add Polygon or Finnhub, write a second module satisfying the interface and branch
in `market.ts`. Nothing in `src/app` or `src/components` imports a provider directly.

Price series are generated, not stored — `src/lib/series.ts` runs a seeded random walk
(mulberry32, keyed on ticker + range) detrended onto a start→end path taken from per-ticker
historical returns. Seeding matters: an unseeded walk would render differently on the server
and the client and trip a hydration mismatch.

## Design system

Tailwind v4 tokens live in `src/app/globals.css` under `@theme`. Dark-first, near-black
(`--color-ink: #07080a`), with `up`/`down` reserved strictly for market direction and a
single restrained blue accent for interactive state. The font stack is the native system
stack, so it renders as SF on Apple devices.

Two conventions worth keeping:

- `.tnum` (tabular figures) on anything numeric, so digits don't jitter as prices tick.
- `.rail` for horizontal scroll regions — no visible scrollbar, no page-level overflow.

## What is deliberately not here

No trading, brokerage, options, crypto, screeners, technical indicators, or paid tiers —
per the MVP scope. Predictions award reputation only and are labelled as community
forecasting, never wagers.

## Next steps (backend)

1. **Supabase project + schema.** `users`, `stocks`, `watchlists`, `posts`, `comments`,
   `reactions`, `predictions`, `follows`, `market_events`, `notifications`. The types in
   `src/lib/types.ts` are already close to the table shapes.
2. **Auth.** Supabase Auth for email, Google and Apple. `/welcome` currently stubs the three
   buttons; wire them and persist the onboarding watchlist to `watchlists` instead of
   `localStorage`. `src/components/app-state.tsx` is the only place that touches storage.
3. **Replace the mock provider.** Add `src/lib/providers/polygon.ts` (or Finnhub/Alpaca),
   branch in `market.ts` on an env var, and keep the mock for local development and tests.
4. **Realtime.** Supabase realtime subscriptions on `posts` and `market_events` so the Live
   tab and the home feed update without a refresh. The feed is already a pure function of
   its inputs (`buildFeed`), so this is a data-source swap.
5. **Market-event generation.** A worker that watches quotes and emits `market_events` rows
   on the conditions the timeline already renders: opens, breakouts, volume pace, new
   highs/lows, analyst actions, milestones.
6. **Prediction resolution.** A scheduled job that resolves predictions at close, writes
   results, and updates karma and streaks.
7. **Earnings live experience.** The `/stock/[ticker]` timeline is the right substrate —
   add a dedicated earnings-session view with polls and a live price ticker.

## Disclaimer

Information on Splash is for informational and entertainment purposes only and is not
financial advice.

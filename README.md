# Splash

The social layer for the stock market. Markets, live.

A front-end prototype of a consumer social product for following the market together.
Modelled on how Real does live sports: the **play-by-play stream is the product**, not a
summary feed. Individual moments land as they happen, each carrying its own reactions and
its own discussion, and every symbol has a live room that gets louder as the price moves.

Covers all **12,874 listed US securities**. Symbols, company names and exchanges are real,
pulled from the official NASDAQ Trader symbol directory. **Prices are simulated** — derived
from the ticker and then ticked live in the browser — so the app runs with no API key and
no backend. The provider seam is intact for swapping in real data.

## What makes it feel live

| Piece | File | What it does |
| --- | --- | --- |
| Tick engine | `src/components/live/live-provider.tsx` | One interval drives every subscribed symbol. Starts at the exact price the server rendered, then moves. |
| Play detection | `src/lib/moments.ts` | Turns price changes into plays: levels broken, session highs/lows, day milestones, runs on the tape. |
| Play-by-play feed | `src/components/live/live-feed.tsx` | The Home centrepiece. New plays stream in with reactions and threads per moment. |
| Live rooms | `src/components/live/stock-chat.tsx` | Per-symbol chat. Message cadence is computed from the live tape, so a 6% move fills the room and a flat tape goes quiet. |
| Quote derivation | `src/lib/quote-engine.ts` | A plausible quote for any of the 12,874 symbols, derived from the ticker string alone. |

Three constraints shaped that code, and they are easy to break by accident:

1. **Derivation never touches a clock or `Math.random`.** The server and the first client
   render must produce identical prices or React flags a hydration mismatch. Movement is
   layered on only after mount.
2. **`quote-engine.ts` must not import `universe.ts`.** The tick engine runs on the client,
   and pulling the 877KB universe index into the browser to read one flag would dwarf the
   rest of the app. Search runs server-side through `/api/search` for the same reason.
3. **Plays are throttled.** A trending symbol makes new highs constantly; announcing each
   one buries the feed. Extremes need a 45s cooldown and a 0.25% gap to count.

## Running it

```bash
npm run dev
```

Then open http://localhost:3200 (the dev script defaults to 3000; the preview config passes
`--port 3200`).

```bash
npm run build           # production build
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm run build:universe  # regenerate src/data/universe.json from scripts/*.txt
```

To refresh the symbol list, re-download the two directory files into `scripts/` from
<https://www.nasdaqtrader.com/dynamic/symdir/> and run `npm run build:universe`.

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
| `/stock/[ticker]` | SSG + dynamic | Any of 12,874 symbols. Nine curated names prerender; the rest render on demand |
| `/search` | client | Universe-wide search via `/api/search`, debounced |
| `/api/search` | route | Server-side ranked search over all 12,874 symbols |
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
    live/
      live-provider.tsx      tick engine + useLiveTick / useLiveTicks / useMomentStream
      live-feed.tsx          the play-by-play stream
      moment-card.tsx        one play, with its own reactions and thread
      live-price.tsx         price that flashes on each tick
      stock-chat.tsx         live room
  data/
    universe.json            12,874 real symbols (generated; server-only)
    stocks.ts                9 curated tickers + hand-set quotes
    social.ts                users, posts, events, predictions, news, earnings
  lib/
    types.ts                 all data models + MarketDataProvider
    market.ts                selects the active provider
    providers/mock.ts        the mock implementation
    universe.ts              universe lookup + ranked search (server-only)
    quote-engine.ts          derives a quote for any symbol (client-safe)
    moments.ts               price change → play-by-play
    live-types.ts            LiveTick, LiveMoment
    chatter.ts               room dialogue, keyed to what the tape is doing
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
3. **Replace simulated prices with real ones.** Add `src/lib/providers/polygon.ts` (or
   Finnhub/Alpaca) and branch in `market.ts` on an env var. Note the free tiers rate-limit
   hard, so the realistic shape is: keep the static universe for search, fetch real quotes
   only for symbols actually opened, and feed them into the tick engine as seeds instead of
   `deriveQuote`. Keep the simulator for local development and tests.
4. **Make the rooms genuinely multi-user.** Right now `stock-chat.tsx` simulates the room
   locally. Swap the message source for a Supabase realtime subscription on a `messages`
   table and the UI stays as-is — the component already renders from an array it does not
   own. Same for reactions on moments.
5. **Move play detection server-side.** `src/lib/moments.ts` currently runs per-browser, so
   two users see different plays. A worker running the same detectors against real quotes
   and writing `market_events` rows would give everyone one shared play-by-play — which is
   what makes reacting to a moment together mean anything.
6. **Prediction resolution.** A scheduled job that resolves predictions at close, writes
   results, and updates karma and streaks.
7. **Earnings live experience.** The `/stock/[ticker]` timeline is the right substrate —
   add a dedicated earnings-session view with polls and a live price ticker.

## Disclaimer

Information on Splash is for informational and entertainment purposes only and is not
financial advice. **All prices, volumes and fundamentals in this prototype are simulated**
and do not reflect real market data. Company names, ticker symbols and exchange listings
are real. Predictions award reputation only and are never wagers.

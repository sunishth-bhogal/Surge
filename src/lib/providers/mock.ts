import { QUOTES, STOCKS } from "@/data/stocks";
import { EARNINGS, EVENTS, INDICES, NEWS, TRENDING } from "@/data/social";
import { buildSeries } from "@/lib/series";
import type { MarketDataProvider, Range, TrendingStock } from "@/lib/types";

export const mockProvider: MarketDataProvider = {
  async getQuote(ticker) {
    return QUOTES[ticker.toUpperCase()] ?? null;
  },

  async getQuotes(tickers) {
    return tickers
      .map((t) => QUOTES[t.toUpperCase()])
      .filter((q): q is NonNullable<typeof q> => Boolean(q));
  },

  async getHistoricalPrices(ticker: string, range: Range) {
    return buildSeries(ticker.toUpperCase(), range);
  },

  async getTrendingStocks() {
    return TRENDING;
  },

  async getMarketIndices() {
    return INDICES;
  },

  async getCompanyNews(ticker) {
    if (!ticker) return NEWS;
    return NEWS.filter((n) => n.ticker === ticker.toUpperCase());
  },

  async getEarningsCalendar() {
    return EARNINGS;
  },

  async getStock(ticker) {
    return STOCKS.find((s) => s.ticker === ticker.toUpperCase()) ?? null;
  },

  async searchStocks(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return STOCKS.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.companyName.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q),
    );
  },

  async getMovers(kind) {
    const rows: TrendingStock[] = [...TRENDING];
    if (kind === "gainers") return rows.sort((a, b) => b.changePercent - a.changePercent);
    if (kind === "losers") return rows.sort((a, b) => a.changePercent - b.changePercent);
    return rows.sort((a, b) => b.posts - a.posts);
  },

  async getMarketEvents(ticker) {
    if (!ticker) return EVENTS;
    return EVENTS.filter((e) => e.ticker === ticker.toUpperCase());
  },
};

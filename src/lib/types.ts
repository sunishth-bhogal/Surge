export type Sentiment = "bullish" | "bearish" | "neutral";

export type ReactionType = "fire" | "rocket" | "eyes" | "laugh" | "skull" | "bull" | "bear";

export interface Stock {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  logoColor: string;
}

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  week52High: number;
  week52Low: number;
  afterHoursPrice?: number;
  afterHoursChangePercent?: number;
}

export type Range = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";

export interface PricePoint {
  t: number;
  price: number;
}

export interface Series {
  ticker: string;
  range: Range;
  points: PricePoint[];
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  changePercent: number;
  spark: number[];
}

export interface TrendingStock {
  ticker: string;
  companyName: string;
  price: number;
  changePercent: number;
  activeViewers: number;
  posts: number;
  /** Share of community posts tagged bullish, 0–1. */
  bullishShare: number;
}

export interface NewsItem {
  id: string;
  ticker: string;
  source: string;
  headline: string;
  summary: string;
  publishedAt: string;
  minutesAgo: number;
}

export interface EarningsEntry {
  id: string;
  ticker: string;
  companyName: string;
  /** ISO date of the report. */
  date: string;
  dayLabel: string;
  session: "Before Open" | "After Close";
  expectedEps: number;
  expectedRevenue: string;
  followers: number;
  isLive?: boolean;
}

export type MarketEventType =
  | "open"
  | "breakout"
  | "volume"
  | "high"
  | "low"
  | "analyst"
  | "milestone"
  | "earnings"
  | "news";

export interface MarketEvent {
  id: string;
  ticker: string;
  type: MarketEventType;
  time: string;
  headline: string;
  detail?: string;
  changePercent?: number;
  reactions: Partial<Record<ReactionType, number>>;
  comments: number;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  initials: string;
  bio: string;
  karma: number;
  level: "Rookie" | "Trader" | "Analyst" | "Strategist" | "Oracle";
  followers: number;
  following: number;
  predictionAccuracy: number;
  predictionsMade: number;
  streak: number;
  percentile: number;
  watchlist: string[];
  bestCategories: { ticker: string; accuracy: number }[];
}

export interface Post {
  id: string;
  authorId: string;
  ticker: string;
  content: string;
  sentiment: Sentiment;
  minutesAgo: number;
  likes: number;
  comments: number;
}

export interface Prediction {
  id: string;
  ticker: string;
  question: string;
  options: { label: string; share: number }[];
  totalPredictions: number;
  closesIn: string;
  resolved?: { outcome: string; correct: boolean };
}

export type FeedItem =
  | { kind: "price"; id: string; event: MarketEvent; quote: Quote; stock: Stock }
  | { kind: "news"; id: string; news: NewsItem; quote: Quote; stock: Stock }
  | { kind: "prediction"; id: string; prediction: Prediction; stock: Stock }
  | { kind: "earnings"; id: string; earnings: EarningsEntry; quote: Quote; stock: Stock }
  | { kind: "buzz"; id: string; trending: TrendingStock; rank: number; stock: Stock };

export interface Notification {
  id: string;
  type: "price" | "earnings" | "prediction" | "social" | "milestone";
  tone?: "up" | "down";
  ticker?: string;
  message: string;
  minutesAgo: number;
  read: boolean;
}

/**
 * The single seam between Splash and whatever supplies market data.
 * Swapping the mock implementation for Polygon/Finnhub/Alpaca should not
 * require touching anything in src/app or src/components.
 */
export interface MarketDataProvider {
  getQuote(ticker: string): Promise<Quote | null>;
  getQuotes(tickers: string[]): Promise<Quote[]>;
  getHistoricalPrices(ticker: string, range: Range): Promise<Series>;
  getTrendingStocks(): Promise<TrendingStock[]>;
  getMarketIndices(): Promise<MarketIndex[]>;
  getCompanyNews(ticker?: string): Promise<NewsItem[]>;
  getEarningsCalendar(): Promise<EarningsEntry[]>;
  getStock(ticker: string): Promise<Stock | null>;
  searchStocks(query: string): Promise<Stock[]>;
  getMovers(kind: "gainers" | "losers" | "active"): Promise<TrendingStock[]>;
  getMarketEvents(ticker?: string): Promise<MarketEvent[]>;
}

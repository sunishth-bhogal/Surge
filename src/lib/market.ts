import { mockProvider } from "@/lib/providers/mock";
import type { MarketDataProvider } from "@/lib/types";

/**
 * The only place a provider is chosen. Adding Polygon or Finnhub means writing
 * another module that satisfies MarketDataProvider and branching here.
 */
export const marketData: MarketDataProvider = mockProvider;

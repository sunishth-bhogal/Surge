import { NextResponse } from "next/server";
import { resolveQuotes } from "@/lib/resolve";

export const dynamic = "force-dynamic";

/**
 * Live prices for the symbols currently on screen. The client polls this rather
 * than calling Yahoo directly: the browser would be blocked by CORS, and routing
 * through the server lets one cache serve every viewer.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("tickers") ?? "";
  const tickers = raw
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 40);

  if (!tickers.length) return NextResponse.json({ quotes: {}, source: "simulated" });

  const { quotes, source } = await resolveQuotes(tickers);
  return NextResponse.json({
    quotes: Object.fromEntries(
      Object.entries(quotes).map(([t, q]) => [
        t,
        {
          price: q.price,
          previousClose: q.previousClose,
          changePercent: q.changePercent,
          dayHigh: q.dayHigh,
          dayLow: q.dayLow,
          volume: q.volume,
        },
      ]),
    ),
    source,
  });
}

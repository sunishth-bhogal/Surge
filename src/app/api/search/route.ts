import { NextResponse } from "next/server";
import { resolveQuotes } from "@/lib/resolve";
import { searchUniverse } from "@/lib/universe";

/**
 * Search runs on the server so the client never downloads the ~877KB universe
 * index. Quotes are attached here too, since they are derived, not fetched.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  // Top hits get real prices; the long tail stays derived so one search does
  // not fan out into 25 upstream requests.
  const hits = searchUniverse(q, 25);
  const { quotes, source } = await resolveQuotes(hits.slice(0, 8).map((h) => h.t));

  const results = hits.map((s) => {
    const quote = quotes[s.t];
    return {
      ticker: s.t,
      name: s.n,
      exchange: s.x,
      isEtf: Boolean(s.e),
      price: quote?.price ?? 0,
      changePercent: quote?.changePercent ?? 0,
      live: Boolean(quotes[s.t]) && source === "live",
    };
  });

  return NextResponse.json({ results, source });
}

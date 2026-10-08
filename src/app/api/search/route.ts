import { NextResponse } from "next/server";
import { deriveQuote } from "@/lib/quote-engine";
import { searchUniverse } from "@/lib/universe";

/**
 * Search runs on the server so the client never downloads the ~877KB universe
 * index. Quotes are attached here too, since they are derived, not fetched.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = searchUniverse(q, 25).map((s) => {
    const quote = deriveQuote(s.t);
    return {
      ticker: s.t,
      name: s.n,
      exchange: s.x,
      isEtf: Boolean(s.e),
      price: quote?.price ?? 0,
      changePercent: quote?.changePercent ?? 0,
    };
  });

  return NextResponse.json({ results });
}

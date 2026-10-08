import { NextResponse } from "next/server";
import { fetchMarketState } from "@/lib/providers/yahoo";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await fetchMarketState();
  return NextResponse.json({
    source: state ? "live" : "simulated",
    open: state === "regular",
    state: state ?? "unknown",
  });
}

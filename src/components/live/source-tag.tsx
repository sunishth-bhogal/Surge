import type { DataSource } from "@/lib/resolve";

/**
 * The app must never let a simulated price pass for a real one, so every
 * surface showing prices carries this.
 */
export function SourceTag({
  source,
  marketOpen,
}: {
  source: DataSource;
  marketOpen?: boolean;
}) {
  if (source === "simulated") {
    return (
      <span
        title="Prices on this screen are generated, not real market data"
        className="inline-flex items-center gap-1.5 rounded-md bg-raised px-1.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] text-faint uppercase"
      >
        Simulated
      </span>
    );
  }

  return (
    <span
      title="Real market data from Yahoo, typically delayed about 15 minutes"
      className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold tracking-[0.08em] uppercase ${
        marketOpen ? "bg-up/14 text-up" : "bg-raised text-muted"
      }`}
    >
      <span className={`size-1.5 rounded-full ${marketOpen ? "live-dot bg-up" : "bg-faint"}`} />
      {marketOpen ? "Live · 15m delay" : "Market closed"}
    </span>
  );
}

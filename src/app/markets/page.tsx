import Link from "next/link";
import { CalendarClock, Users } from "lucide-react";
import { TopBar } from "@/components/chrome/top-bar";
import { IndexRail } from "@/components/markets/index-rail";
import { Movers } from "@/components/markets/movers";
import { StockRow } from "@/components/markets/stock-row";
import {
  Card,
  Delta,
  LiveTag,
  SectionHeader,
  TickerBadge,
} from "@/components/ui/primitives";
import { STOCKS } from "@/data/stocks";
import { marketData } from "@/lib/market";
import { compact } from "@/lib/format";

export default async function MarketsPage() {
  const [indices, trending, earnings] = await Promise.all([
    marketData.getMarketIndices(),
    marketData.getTrendingStocks(),
    marketData.getEarningsCalendar(),
  ]);

  const advancing = trending.filter((t) => t.changePercent > 0).length;
  const breadth = Math.round((advancing / trending.length) * 100);

  return (
    <>
      <TopBar title="Markets" large right={<LiveTag label="Open" />} />

      <main className="mx-auto max-w-xl px-4 pb-8">
        <section className="pt-4">
          <IndexRail indices={indices} />
          <p className="mt-3 px-1 text-[13px] leading-relaxed text-muted">
            <span className="font-semibold text-bright">Risk is on today.</span>{" "}
            {breadth}% of the most-watched names on Splash are green, and the Nasdaq is
            leading with semis out front.
          </p>
        </section>

        <section className="mt-7">
          <SectionHeader title="Trending on Splash" />
          <div className="divide-y divide-line-soft overflow-hidden rounded-card border border-line-soft bg-surface">
            {trending.slice(0, 5).map((row, i) => (
              <StockRow key={row.ticker} row={row} rank={i + 1} showBuzz />
            ))}
          </div>
        </section>

        <section className="mt-7">
          <SectionHeader title="Biggest movers" />
          <Movers />
        </section>

        <section className="mt-7">
          <SectionHeader title="Upcoming earnings" />
          <div className="rail -mx-4 flex gap-2.5 px-4">
            {earnings.map((entry) => {
              const stock = STOCKS.find((s) => s.ticker === entry.ticker)!;
              return (
                <Link key={entry.id} href={`/stock/${entry.ticker}`} className="min-w-[216px]">
                  <Card className={`h-full p-4 ${entry.isLive ? "border-down/35" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      <TickerBadge ticker={entry.ticker} color={stock.logoColor} size={30} />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold">{entry.ticker}</p>
                        <p className="truncate text-[11.5px] text-faint">{entry.companyName}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-muted">
                      {entry.isLive ? (
                        <LiveTag />
                      ) : (
                        <>
                          <CalendarClock size={13} strokeWidth={2.2} />
                          {entry.dayLabel} · {entry.session}
                        </>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line-soft pt-3">
                      <div>
                        <p className="text-[10.5px] font-medium text-faint">Expected EPS</p>
                        <p className="tnum text-[14px] font-semibold">
                          ${entry.expectedEps.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10.5px] font-medium text-faint">Revenue</p>
                        <p className="tnum text-[14px] font-semibold">{entry.expectedRevenue}</p>
                      </div>
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-faint">
                      <Users size={12} strokeWidth={2.2} />
                      <span className="tnum">{compact(entry.followers)} following</span>
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-7">
          <SectionHeader title="Sector read" />
          <Card className="divide-y divide-line-soft">
            {[
              { name: "Semiconductors", change: 3.84, note: "NVDA and AMD carrying the tape" },
              { name: "Internet", change: 1.62, note: "Cloud backlog headlines" },
              { name: "Consumer Tech", change: 0.94, note: "AI partnership news" },
              { name: "Automotive", change: -1.88, note: "European delivery data" },
            ].map((sector) => (
              <div key={sector.name} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{sector.name}</p>
                  <p className="truncate text-[12px] text-faint">{sector.note}</p>
                </div>
                <Delta value={sector.change} />
              </div>
            ))}
          </Card>
        </section>
      </main>
    </>
  );
}

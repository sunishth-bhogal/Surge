import Link from "next/link";
import { Delta, TickerBadge } from "@/components/ui/primitives";
import { Sparkline } from "@/components/ui/sparkline";
import { compact, price } from "@/lib/format";
import { buildSpark } from "@/lib/series";
import { STOCKS } from "@/data/stocks";
import type { TrendingStock } from "@/lib/types";

export function StockRow({
  row,
  rank,
  showBuzz = false,
}: {
  row: TrendingStock;
  rank?: number;
  showBuzz?: boolean;
}) {
  const stock = STOCKS.find((s) => s.ticker === row.ticker);
  const up = row.changePercent >= 0;
  const bullish = Math.round(row.bullishShare * 100);

  return (
    <Link
      href={`/stock/${row.ticker}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised"
    >
      {rank !== undefined && (
        <span className="tnum w-3.5 shrink-0 text-[13px] font-bold text-faint">{rank}</span>
      )}
      {stock && <TickerBadge ticker={row.ticker} color={stock.logoColor} size={36} />}

      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-bold tracking-[-0.01em]">{row.ticker}</p>
        <p className="truncate text-[12px] text-faint">
          {showBuzz ? `${compact(row.activeViewers)} watching` : row.companyName}
        </p>
      </div>

      <span className={showBuzz ? "hidden sm:block" : ""}>
        <Sparkline points={buildSpark(row.ticker, "1D", 20)} positive={up} width={44} height={22} />
      </span>

      <div className="w-[76px] shrink-0 text-right">
        <p className="tnum text-[14px] font-semibold">{price(row.price)}</p>
        <div className="mt-0.5 flex justify-end">
          <Delta value={row.changePercent} showBg={false} />
        </div>
      </div>

      {showBuzz && (
        <span
          title={`${bullish}% of posts bullish`}
          className="flex w-9 shrink-0 flex-col items-end gap-1"
        >
          <span className="h-1.5 w-full overflow-hidden rounded-full bg-down/30">
            <span className="block h-full rounded-full bg-up" style={{ width: `${bullish}%` }} />
          </span>
          <span className="tnum text-[10px] font-semibold text-faint">{bullish}%</span>
        </span>
      )}
    </Link>
  );
}

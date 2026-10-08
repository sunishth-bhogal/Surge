import { Sparkline } from "@/components/ui/sparkline";
import { indexValue, signedPercent } from "@/lib/format";
import type { MarketIndex } from "@/lib/types";

export function IndexRail({ indices }: { indices: MarketIndex[] }) {
  return (
    <div className="rail -mx-4 flex gap-2 px-4">
      {indices.map((index) => {
        const up = index.changePercent >= 0;
        return (
          <div
            key={index.symbol}
            className="min-w-[132px] flex-1 rounded-2xl border border-line-soft bg-surface px-3.5 py-3"
          >
            <p className="text-[12px] font-semibold text-muted">{index.name}</p>
            <div className="mt-1.5 flex items-end justify-between gap-2">
              <div>
                <p className="tnum text-[15px] leading-none font-bold tracking-[-0.02em]">
                  {indexValue(index.value)}
                </p>
                <p
                  className="tnum mt-1 text-[12.5px] font-semibold"
                  style={{ color: up ? "var(--color-up)" : "var(--color-down)" }}
                >
                  {signedPercent(index.changePercent)}
                </p>
              </div>
              <Sparkline points={index.spark} positive={up} width={48} height={24} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

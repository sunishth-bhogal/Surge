import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

export function TopBar({
  title,
  subtitle,
  back,
  right,
  large = false,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
  large?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-ink/88 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center gap-2">
        {back && (
          <Link
            href={back}
            aria-label="Back"
            className="-ml-2 grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-bright"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1
            className={`truncate font-bold tracking-[-0.03em] ${
              large ? "text-[26px] leading-tight" : "text-[17px]"
            }`}
          >
            {title}
          </h1>
          {subtitle && <p className="truncate text-[12.5px] text-faint">{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

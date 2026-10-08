"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, ArrowRight, Check, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useAppState } from "@/components/app-state";
import { Delta, TickerBadge } from "@/components/ui/primitives";
import { ONBOARDING_SUGGESTIONS, QUOTES, STOCKS } from "@/data/stocks";
import { price } from "@/lib/format";

const MIN_PICKS = 5;

export default function WelcomePage() {
  const router = useRouter();
  const { watchlist, completeOnboarding } = useAppState();
  const [step, setStep] = useState<"auth" | "picks">("auth");
  const [picked, setPicked] = useState<string[]>(watchlist);

  function toggle(ticker: string) {
    setPicked((p) => (p.includes(ticker) ? p.filter((t) => t !== ticker) : [...p, ticker]));
  }

  if (step === "auth") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-between px-6 py-12">
        <div className="flex flex-1 flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-[46px] leading-[0.95] font-bold tracking-[-0.045em]">Splash</h1>
            <p className="mt-4 text-[19px] leading-snug font-medium text-muted">
              The social layer for the stock market.
              <br />
              Follow the market together.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col gap-2.5"
          >
            <button
              type="button"
              onClick={() => setStep("picks")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-bright px-5 py-3.5 text-[15px] font-semibold text-ink transition-[filter] hover:brightness-90"
            >
              <Apple size={17} strokeWidth={2.2} fill="currentColor" />
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => setStep("picks")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3.5 text-[15px] font-semibold transition-colors hover:bg-raised"
            >
              <GoogleMark />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => setStep("picks")}
              className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3.5 text-[15px] font-semibold transition-colors hover:bg-raised"
            >
              <Mail size={17} strokeWidth={2.2} />
              Sign up with email
            </button>
          </motion.div>
        </div>

        <p className="text-center text-[11.5px] leading-relaxed text-faint/80">
          Splash is for informational and entertainment purposes only and is not financial
          advice. Predictions award reputation, never money.
        </p>
      </main>
    );
  }

  const enough = picked.length >= MIN_PICKS;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 pt-12 pb-6">
      <h1 className="text-[28px] leading-tight font-bold tracking-[-0.035em]">
        What stocks do you follow?
      </h1>
      <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
        Pick at least {MIN_PICKS}. Your feed gets built around them, and events on these names
        get pushed to the top.
      </p>

      <div className="mt-6 grid flex-1 grid-cols-2 content-start gap-2.5 sm:grid-cols-3">
        {ONBOARDING_SUGGESTIONS.map((ticker) => {
          const stock = STOCKS.find((s) => s.ticker === ticker)!;
          const quote = QUOTES[ticker];
          const on = picked.includes(ticker);
          return (
            <button
              key={ticker}
              type="button"
              onClick={() => toggle(ticker)}
              aria-pressed={on}
              className={`relative rounded-2xl border p-3.5 text-left transition-colors ${
                on ? "border-accent bg-accent/8" : "border-line bg-surface hover:border-faint/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <TickerBadge ticker={ticker} color={stock.logoColor} size={30} />
                {on && (
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 520, damping: 18 }}
                    className="grid size-5 place-items-center rounded-full bg-accent text-white"
                  >
                    <Check size={12} strokeWidth={3.2} />
                  </motion.span>
                )}
              </div>
              <p className="mt-2.5 text-[14.5px] font-bold tracking-[-0.01em]">{ticker}</p>
              <p className="truncate text-[11.5px] text-faint">{stock.companyName}</p>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="tnum text-[12.5px] font-semibold">{price(quote.price)}</span>
                <Delta value={quote.changePercent} showBg={false} />
              </div>
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-5 bg-gradient-to-t from-ink via-ink to-transparent pt-4 pb-2">
        <button
          type="button"
          disabled={!enough}
          onClick={() => {
            completeOnboarding(picked);
            router.push("/");
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-semibold transition-colors ${
            enough
              ? "bg-accent text-white hover:brightness-110"
              : "cursor-not-allowed bg-raised text-faint"
          }`}
        >
          {enough ? "Build my feed" : `Pick ${MIN_PICKS - picked.length} more`}
          {enough && <ArrowRight size={17} strokeWidth={2.4} />}
        </button>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23 12.27c0-.82-.07-1.6-.21-2.36H12v4.47h6.17a5.3 5.3 0 0 1-2.29 3.47v2.88h3.7C21.74 18.75 23 15.8 23 12.27Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1.03 7.6-2.78l-3.71-2.88c-1.03.69-2.35 1.1-3.89 1.1-2.99 0-5.52-2.02-6.43-4.73H1.73v2.97A11.49 11.49 0 0 0 12 23.5Z" />
      <path fill="#FBBC05" d="M5.57 14.21a6.9 6.9 0 0 1 0-4.41V6.83H1.73a11.5 11.5 0 0 0 0 10.34l3.84-2.96Z" />
      <path fill="#EA4335" d="M12 5.07c1.69 0 3.2.58 4.4 1.72l3.28-3.28C17.7 1.63 15.1.5 12 .5A11.49 11.49 0 0 0 1.73 6.83L5.57 9.8c.91-2.71 3.44-4.73 6.43-4.73Z" />
    </svg>
  );
}

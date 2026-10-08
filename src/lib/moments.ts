import type { LiveMoment, MomentKind } from "@/lib/live-types";

interface Detectable {
  ticker: string;
  price: number;
  previousClose: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  upStreak: number;
  downStreak: number;
  fired: Set<string>;
  /** Last extreme actually announced, and when — used to throttle. */
  announcedHigh: number;
  announcedLow: number;
  lastExtremeAt: number;
}

/**
 * A tape makes new highs constantly during a run. Announcing every one buries
 * the feed, so an extreme has to clear the last announced one by this much and
 * wait out this cooldown before it counts as a play.
 */
const EXTREME_COOLDOWN_MS = 45_000;
const EXTREME_MIN_GAP = 0.0025;

/** Percent milestones that are worth announcing. */
const MILESTONES = [1, 2, 3, 5, 7, 10, 15, 20];

let seq = 0;

function make(
  s: Detectable,
  kind: MomentKind,
  headline: string,
  detail: string,
  tone: LiveMoment["tone"],
  intensity: LiveMoment["intensity"] = "normal",
): LiveMoment {
  return {
    id: `m${++seq}`,
    ticker: s.ticker,
    kind,
    headline,
    detail,
    price: s.price,
    changePercent: s.changePercent,
    at: Date.now(),
    tone,
    intensity,
  };
}

/** Round numbers traders actually talk about, scaled to the share price. */
function levelStep(price: number) {
  if (price >= 500) return 25;
  if (price >= 100) return 10;
  if (price >= 20) return 5;
  if (price >= 5) return 1;
  return 0.5;
}

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Turns a price change into play-by-play. Each threshold fires once per
 * session so the feed stays signal, not noise.
 */
export function detectMoments(s: Detectable, prev: number): LiveMoment[] {
  const out: LiveMoment[] = [];

  // Round-number levels, crossed in either direction.
  const step = levelStep(s.price);
  const crossedUp = Math.floor(s.price / step) > Math.floor(prev / step);
  const crossedDown = Math.floor(s.price / step) < Math.floor(prev / step);
  if (crossedUp || crossedDown) {
    const level = crossedUp
      ? Math.floor(s.price / step) * step
      : Math.ceil(s.price / step) * step;
    const key = `level:${level}:${crossedUp ? "u" : "d"}`;
    if (!s.fired.has(key)) {
      s.fired.add(key);
      out.push(
        make(
          s,
          "level",
          crossedUp
            ? `${s.ticker} breaks above ${money(level)}`
            : `${s.ticker} loses ${money(level)}`,
          crossedUp
            ? `Pushed through ${money(level)} and holding at ${money(s.price)}.`
            : `Slipped under ${money(level)}, now ${money(s.price)}.`,
          crossedUp ? "up" : "down",
        ),
      );
    }
  }

  // Percent milestones off the previous close.
  const absMove = Math.abs(s.changePercent);
  for (const m of MILESTONES) {
    if (absMove < m) break;
    const up = s.changePercent > 0;
    const key = `pct:${m}:${up ? "u" : "d"}`;
    if (s.fired.has(key)) continue;
    s.fired.add(key);
    out.push(
      make(
        s,
        "milestone",
        up ? `${s.ticker} is up ${m}% on the day` : `${s.ticker} is down ${m}% on the day`,
        `Trading at ${money(s.price)} against a ${money(s.previousClose)} close.`,
        up ? "up" : "down",
        m >= 5 ? "big" : "normal",
      ),
    );
  }

  // New session extremes, throttled so a trending name doesn't spam the feed.
  const now = Date.now();
  const cooledDown = now - s.lastExtremeAt > EXTREME_COOLDOWN_MS;

  if (
    s.price >= s.dayHigh &&
    s.price > prev &&
    absMove > 0.4 &&
    cooledDown &&
    s.price > s.announcedHigh * (1 + EXTREME_MIN_GAP)
  ) {
    s.announcedHigh = s.price;
    s.lastExtremeAt = now;
    out.push(
      make(
        s,
        "high",
        `${s.ticker} sets a new session high`,
        `${money(s.price)} is the top of the day so far.`,
        "up",
      ),
    );
  }

  if (
    s.price <= s.dayLow &&
    s.price < prev &&
    absMove > 0.4 &&
    cooledDown &&
    s.price < s.announcedLow * (1 - EXTREME_MIN_GAP)
  ) {
    s.announcedLow = s.price;
    s.lastExtremeAt = now;
    out.push(
      make(
        s,
        "low",
        `${s.ticker} prints a new session low`,
        `Down to ${money(s.price)}, the weakest level today.`,
        "down",
      ),
    );
  }

  // Runs of consecutive ticks one way.
  if (s.upStreak === 8) {
    out.push(make(s, "streak", `${s.ticker} is on a run`, `Eight straight upticks into ${money(s.price)}.`, "up"));
  }
  if (s.downStreak === 8) {
    out.push(make(s, "streak", `${s.ticker} can't catch a bid`, `Eight straight downticks to ${money(s.price)}.`, "down"));
  }

  return out;
}

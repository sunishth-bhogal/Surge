export interface LiveTick {
  ticker: string;
  price: number;
  previousClose: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  /** Direction of the most recent tick: 1 up, -1 down, 0 unchanged. */
  direction: 1 | -1 | 0;
}

export type MomentKind =
  | "level"
  | "high"
  | "low"
  | "milestone"
  | "streak"
  | "reversal"
  | "volume";

/**
 * One play in the play-by-play. Deliberately granular: a moment is a single
 * thing that just happened to one symbol, not a summary of the session.
 */
export interface LiveMoment {
  id: string;
  ticker: string;
  kind: MomentKind;
  headline: string;
  detail: string;
  price: number;
  changePercent: number;
  at: number;
  /**
   * Direction of the play itself, which is not the same as the day change: a
   * stock can print eight downticks while still green on the session. Icon and
   * border colour follow this; the percentage keeps its own colour.
   */
  tone: "up" | "down";
  /** Drives colour; big moves read louder. */
  intensity: "normal" | "big";
}

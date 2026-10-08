/**
 * Splash leads with the story, not the number. Every card headline comes from
 * here so the voice stays consistent across the feed, markets and stock pages.
 */
export function moveHeadline(ticker: string, changePercent: number) {
  const p = changePercent;
  if (p >= 5) return `${ticker} is ripping 🔥`;
  if (p >= 3) return `${ticker} is running`;
  if (p >= 1.5) return `${ticker} is grinding higher`;
  if (p >= 0) return `${ticker} is holding green`;
  if (p >= -1.5) return `${ticker} is fading`;
  if (p >= -3) return `${ticker} is slipping`;
  return `${ticker} is getting hit`;
}

export function crowdLine(bullishShare: number) {
  const pct = Math.round(bullishShare * 100);
  if (pct >= 75) return `${pct}% of posts are bullish — the room is one-sided`;
  if (pct >= 60) return `${pct}% of posts are bullish`;
  if (pct >= 45) return `Split room — ${pct}% bullish`;
  if (pct >= 30) return `Crowd is leaning bearish — only ${pct}% bullish`;
  return `${100 - pct}% of posts are bearish`;
}

export function volumeLine(volume: number, avgVolume: number) {
  const x = volume / avgVolume;
  if (x >= 1.8) return `Volume is ${x.toFixed(1)}× its 30-day average`;
  if (x >= 1.15) return `Volume running ${Math.round((x - 1) * 100)}% above average`;
  if (x <= 0.75) return `Quiet tape — ${Math.round((1 - x) * 100)}% below average volume`;
  return "Volume in line with average";
}

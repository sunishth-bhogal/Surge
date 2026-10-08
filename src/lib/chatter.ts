import { USERS } from "@/data/social";
import type { LiveTick } from "@/lib/live-types";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  color: string;
  initials: string;
  text: string;
  at: number;
  sentiment: "bullish" | "bearish" | "neutral";
  /** Set when the message was triggered by a specific play. */
  replyingTo?: string;
  self?: boolean;
}

/**
 * Lines are keyed to what the tape is actually doing, so the room reads as if
 * it is watching the same chart the user is. `$P` interpolates the live price,
 * `$T` the ticker, `$C` the day change.
 */
const LINES = {
  rip: [
    "$T just went vertical 🚀",
    "ok who bought the whole book",
    "$C and still bidding. this is not normal",
    "$T at $P, we are so back",
    "volume is doing the talking today 👀",
    "told you at the open",
    "every single dip got bought. every one",
    "$P. I'm not even going to pretend I called this",
    "shorts are getting carried out 💀",
    "this is the kind of move you screenshot",
    "$T green on a red tape says something",
    "whoever is buying up here has conviction",
  ],
  up: [
    "$T grinding higher, $P now",
    "steady bid under this all session",
    "nice base forming around $P",
    "$C on the day, I'll take it",
    "buyers showing up every dip",
    "slow and boring is how real moves start",
    "$T holding its gains into the afternoon",
    "nothing flashy, just up. fine by me",
    "the $P area keeps acting as support",
    "quietly one of the better charts today",
  ],
  flat: [
    "$T doing absolutely nothing today",
    "chop city. $P again",
    "waiting for a catalyst here",
    "someone wake this tape up",
    "flat is a position I guess",
    "$T has been in a 20 cent range for an hour",
    "lowest volume day in a while",
    "nothing to do here until it picks a side",
    "$P, $P, $P. riveting",
    "coiling. that's what I'm telling myself anyway",
  ],
  down: [
    "$T leaking lower, $P",
    "every bounce getting sold",
    "$C and it feels heavier than that",
    "no bid under this",
    "support at $P or we see lower",
    "sellers are patient today, that's the worry",
    "$T can't hold a rally for ten minutes",
    "slow bleed is worse than a flush honestly",
    "watching $P. lose it and I'm out",
    "lower highs all session 🐻",
  ],
  dump: [
    "$T is getting taken out back 💀",
    "$C. what happened",
    "knife catching at $P, pray for me",
    "that was a real seller, not noise",
    "capitulation or just the start 🐻",
    "gap filled and then some",
    "$T down to $P. brutal",
    "anyone have actual news or is this just flows",
    "this is why you size properly",
    "stepping away from the screen for a bit",
  ],
} as const;

const REPLIES = [
  "this ages well or terribly, no in between",
  "same read here",
  "disagree but respect it",
  "zoom out, it's fine",
  "watch the volume not the price",
  "calling it now 🔥",
  "saving this one",
  "bold take for a Tuesday",
  "been saying this all week",
  "what's your level though",
  "respectfully, no",
  "finally someone said it",
];

/**
 * Rooms are small pools of lines, so naive random picking produces visible
 * back-to-back repeats. Each room remembers what it recently said and avoids
 * those until the pool is exhausted.
 */
const recentByRoom = new Map<string, string[]>();
const RECENT_MEMORY = 6;

function pickFresh(room: string, pool: readonly string[]) {
  const recent = recentByRoom.get(room) ?? [];
  let fresh = pool.filter((line) => !recent.includes(line));

  // Pool exhausted: forget everything but the last line, so the only thing
  // still barred is an immediate back-to-back repeat.
  if (!fresh.length) {
    const last = recent[recent.length - 1];
    fresh = pool.filter((line) => line !== last);
    recentByRoom.set(room, last ? [last] : []);
  }

  const choice = fresh[Math.floor(Math.random() * fresh.length)];
  recentByRoom.set(room, [...(recentByRoom.get(room) ?? []), choice].slice(-RECENT_MEMORY));
  return choice;
}

function bucket(tick: LiveTick): keyof typeof LINES {
  const c = tick.changePercent;
  if (c >= 4) return "rip";
  if (c >= 0.6) return "up";
  if (c > -0.6) return "flat";
  if (c > -4) return "down";
  return "dump";
}

let seq = 0;

export function makeMessage(tick: LiveTick, replyingTo?: string): ChatMessage {
  const author = USERS[Math.floor(Math.random() * USERS.length)];
  const mood = bucket(tick);
  const template = replyingTo
    ? pickFresh(`${tick.ticker}:reply`, REPLIES)
    : pickFresh(tick.ticker, LINES[mood]);

  const text = template
    .replace(/\$T/g, tick.ticker)
    .replace(/\$P/g, `$${tick.price.toFixed(2)}`)
    .replace(/\$C/g, `${tick.changePercent >= 0 ? "+" : ""}${tick.changePercent.toFixed(2)}%`);

  return {
    id: `c${++seq}`,
    userId: author.id,
    username: author.username,
    color: author.avatarColor,
    initials: author.initials,
    text,
    at: Date.now(),
    sentiment: mood === "rip" || mood === "up" ? "bullish" : mood === "flat" ? "neutral" : "bearish",
    replyingTo,
  };
}

/**
 * How long until the next message. A room watching a 6% move talks constantly;
 * a flat tape goes quiet. This is what makes the chat feel tied to the chart
 * rather than running on a fixed timer.
 */
export function nextDelay(tick: LiveTick) {
  const heat = Math.min(1, Math.abs(tick.changePercent) / 6);
  const base = 7200 - heat * 5400;
  return base * (0.55 + Math.random() * 0.9);
}

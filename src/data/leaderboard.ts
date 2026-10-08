import { USERS } from "@/data/social";
import type { User } from "@/lib/types";

/**
 * A leaderboard needs a crowd to be worth looking at, and six hand-written
 * users isn't one. These fill the ranks around the authored accounts.
 *
 * Generated from a fixed seed so ranks don't reshuffle between renders — a
 * leaderboard that changed every refresh would be worse than none.
 */

const HANDLES = [
  "marketmaven", "deltaonly", "tape_jockey", "sigmadrift", "liquidityhunt",
  "bidwhacker", "gammaqueen", "the_close", "slowcompound", "chartsnotnews",
  "exitliquidity", "vwap_vince", "basis_point", "openingdrive", "riskparity_r",
  "shortdated", "flowtrader88", "quietaccumulate", "redtodaygreen", "thesisdrift",
  "levelsonly", "macro_mel", "smallcapsam", "earningsrunner", "fadethegap",
  "bookdepth", "candlecounter", "nofomo", "twosigmas", "latetapeclub",
  "patientbid", "rangeboundrob", "breakoutbea", "meanrevert", "carrytrade_c",
];

const COLORS = [
  "#30d158", "#3d7dff", "#ff9f0a", "#bf5af2", "#64d2ff",
  "#ff453a", "#5ac8fa", "#ffd60a", "#ff6482", "#32d74b",
];

const LEVELS: User["level"][] = ["Rookie", "Trader", "Analyst", "Strategist", "Oracle"];

function seeded(n: number) {
  let a = (n * 2654435761) >>> 0;
  return () => {
    a ^= a << 13;
    a >>>= 0;
    a ^= a >> 17;
    a ^= a << 5;
    a >>>= 0;
    return a / 4294967296;
  };
}

function initialsFor(handle: string) {
  const letters = handle.replace(/[^a-z]/gi, "");
  return (letters.slice(0, 2) || "??").toUpperCase();
}

const generated: User[] = HANDLES.map((username, i) => {
  const rand = seeded(i + 7);
  const accuracy = Math.round(44 + rand() * 34);
  const predictionsMade = Math.round(90 + rand() * 1900);

  // Karma has to follow from performance, not float free of it — otherwise the
  // board shows a "Rookie" sitting fifth with 1,300 calls at 73%.
  const karma = Math.round(
    predictionsMade * (accuracy / 100) * 6 * (0.75 + rand() * 0.6),
  );
  const levelIndex =
    karma >= 8000 ? 4 : karma >= 5000 ? 3 : karma >= 2500 ? 2 : karma >= 1000 ? 1 : 0;

  return {
    id: `g${i}`,
    username,
    displayName: username
      .replace(/[_\d]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim(),
    avatarColor: COLORS[i % COLORS.length],
    initials: initialsFor(username),
    bio: "",
    karma,
    level: LEVELS[levelIndex],
    followers: Math.round(40 + rand() * 9_000),
    following: Math.round(20 + rand() * 500),
    predictionAccuracy: accuracy,
    predictionsMade,
    streak: Math.round(rand() * 14),
    percentile: Math.max(1, Math.round(100 - accuracy)),
    watchlist: [],
    bestCategories: [],
  };
});

export const ALL_USERS: User[] = [...USERS, ...generated];

export type Board = "accuracy" | "karma" | "streak";

/**
 * Accuracy alone would put a user who went 3-for-3 above someone 1,200 calls
 * deep, so the accuracy board requires a real sample size.
 */
const MIN_PREDICTIONS = 150;

export function rankedBy(board: Board): User[] {
  const pool =
    board === "accuracy"
      ? ALL_USERS.filter((u) => u.predictionsMade >= MIN_PREDICTIONS)
      : ALL_USERS;

  return [...pool].sort((a, b) => {
    if (board === "accuracy") {
      return (
        b.predictionAccuracy - a.predictionAccuracy ||
        b.predictionsMade - a.predictionsMade
      );
    }
    if (board === "karma") return b.karma - a.karma;
    return b.streak - a.streak || b.predictionAccuracy - a.predictionAccuracy;
  });
}

export const BOARD_META: Record<
  Board,
  { label: string; metric: (u: User) => string; caption: string }
> = {
  accuracy: {
    label: "Accuracy",
    metric: (u) => `${u.predictionAccuracy}%`,
    caption: `Minimum ${MIN_PREDICTIONS} resolved predictions to qualify`,
  },
  karma: {
    label: "Karma",
    metric: (u) => u.karma.toLocaleString("en-US"),
    caption: "Earned from correct calls, useful posts and discussion",
  },
  streak: {
    label: "Streak",
    metric: (u) => `${u.streak}d`,
    caption: "Consecutive days with at least one correct prediction",
  },
};

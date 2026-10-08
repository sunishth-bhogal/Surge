"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { BOARD_META, rankedBy, type Board } from "@/data/leaderboard";
import { CURRENT_USER_ID } from "@/data/social";
import { Avatar, Card } from "@/components/ui/primitives";
import { compact } from "@/lib/format";

const BOARDS: Board[] = ["accuracy", "karma", "streak"];

/** Medal tint for the top three; everyone else gets a plain rank number. */
const PODIUM = ["#ffd60a", "#c7cdd4", "#d08c5a"];

export function LeaderboardTable() {
  const [board, setBoard] = useState<Board>("accuracy");

  const { rows, meta, myRank, me } = useMemo(() => {
    const ranked = rankedBy(board);
    const index = ranked.findIndex((u) => u.id === CURRENT_USER_ID);
    return {
      rows: ranked.slice(0, 25),
      meta: BOARD_META[board],
      myRank: index === -1 ? null : index + 1,
      me: index === -1 ? null : ranked[index],
    };
  }, [board]);

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-raised p-1">
        {BOARDS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBoard(b)}
            aria-pressed={b === board}
            className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
              b === board ? "bg-hover text-bright" : "text-faint hover:text-muted"
            }`}
          >
            {BOARD_META[b].label}
          </button>
        ))}
      </div>

      <p className="mt-2.5 px-1 text-[12px] text-faint">{meta.caption}</p>

      {myRank && me && (
        <Card className="mt-3 flex items-center gap-3 border-accent/30 bg-accent/6 px-4 py-3">
          <span className="tnum w-7 shrink-0 text-[14px] font-bold text-accent">
            #{myRank}
          </span>
          <Avatar initials={me.initials} color={me.avatarColor} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-bold">You</p>
            <p className="truncate text-[12px] text-faint">
              {me.level} · {compact(me.predictionsMade)} predictions
            </p>
          </div>
          <span className="tnum shrink-0 text-[15px] font-bold">{meta.metric(me)}</span>
        </Card>
      )}

      <Card className="mt-3 divide-y divide-line-soft">
        {rows.map((user, i) => {
          const isMe = user.id === CURRENT_USER_ID;
          return (
            <Link
              key={user.id}
              href={`/profile/${user.username}`}
              className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-raised ${
                isMe ? "bg-accent/6" : ""
              }`}
            >
              <span className="w-7 shrink-0">
                {i < 3 ? (
                  <Trophy size={16} strokeWidth={2.4} style={{ color: PODIUM[i] }} />
                ) : (
                  <span className="tnum text-[13px] font-semibold text-faint">{i + 1}</span>
                )}
              </span>

              <Avatar initials={user.initials} color={user.avatarColor} size={32} />

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[14px] font-bold tracking-[-0.01em]">
                  {user.username}
                  {user.streak >= 7 && board !== "streak" && (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-accent">
                      <Flame size={10} strokeWidth={2.8} />
                      {user.streak}
                    </span>
                  )}
                </p>
                <p className="truncate text-[12px] text-faint">
                  {user.level} · {compact(user.predictionsMade)} predictions
                </p>
              </div>

              <span className="tnum shrink-0 text-[15px] font-bold">{meta.metric(user)}</span>
            </Link>
          );
        })}
      </Card>

      <p className="mt-4 px-2 text-center text-[11.5px] leading-relaxed text-faint/80">
        Rankings reflect community forecasting only. Nothing here is financial advice, and
        predictions never involve money.
      </p>
    </div>
  );
}

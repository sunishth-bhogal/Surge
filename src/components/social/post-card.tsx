"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, SentimentPill, TickerLink } from "@/components/ui/primitives";
import { ago, compact } from "@/lib/format";
import { userById } from "@/data/social";
import type { Post } from "@/lib/types";

export function PostCard({ post, showTicker = false }: { post: Post; showTicker?: boolean }) {
  const author = userById(post.authorId);
  const [liked, setLiked] = useState(false);

  return (
    <article className="flex gap-3 px-4 py-3.5">
      <Avatar initials={author.initials} color={author.avatarColor} size={34} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[14px] font-bold tracking-[-0.01em]">{author.username}</span>
          <span className="text-[12px] text-faint">{ago(post.minutesAgo)}</span>
          {showTicker && <TickerLink ticker={post.ticker} className="text-[12.5px]" />}
          <SentimentPill sentiment={post.sentiment} />
        </div>

        <p className="mt-1.5 text-[14.5px] leading-relaxed text-bright/92">{post.content}</p>

        <div className="mt-2.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLiked((l) => !l)}
            aria-pressed={liked}
            aria-label="Like"
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium transition-colors ${
              liked ? "text-down" : "text-faint hover:bg-raised hover:text-muted"
            }`}
          >
            <motion.span
              key={String(liked)}
              initial={liked ? { scale: 0.6 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 520, damping: 15 }}
              className="grid place-items-center"
            >
              <Heart size={14} strokeWidth={2.2} fill={liked ? "currentColor" : "none"} />
            </motion.span>
            <span className="tnum">{compact(post.likes + (liked ? 1 : 0))}</span>
          </button>

          <span className="flex items-center gap-1.5 px-2 py-1 text-[12.5px] font-medium text-faint">
            <MessageCircle size={14} strokeWidth={2.2} />
            <span className="tnum">{compact(post.comments)}</span>
          </span>

          <button
            type="button"
            aria-label="Share post"
            className="grid size-[26px] place-items-center rounded-lg text-faint transition-colors hover:bg-raised hover:text-muted"
          >
            <Share size={13} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </article>
  );
}

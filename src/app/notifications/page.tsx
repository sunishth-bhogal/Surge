import Link from "next/link";
import { Bell, CalendarClock, MessageCircle, Target, TrendingDown, TrendingUp } from "lucide-react";
import { TopBar } from "@/components/chrome/top-bar";
import { Card } from "@/components/ui/primitives";
import { NOTIFICATIONS } from "@/data/social";
import { ago } from "@/lib/format";
import type { Notification } from "@/lib/types";

const ICON = {
  price: TrendingUp,
  earnings: CalendarClock,
  prediction: Target,
  social: MessageCircle,
  milestone: Bell,
} as const;

const TONE = {
  price: "text-up",
  earnings: "text-accent",
  prediction: "text-up",
  social: "text-muted",
  milestone: "text-accent",
} as const;

function Row({ item }: { item: Notification }) {
  const Icon = item.tone === "down" ? TrendingDown : ICON[item.type];
  const tone = item.tone === "down" ? "text-down" : TONE[item.type];
  const body = (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-raised ${
        item.read ? "" : "bg-accent/4"
      }`}
    >
      <span
        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-raised ${tone}`}
      >
        <Icon size={16} strokeWidth={2.3} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-snug text-bright/92">{item.message}</p>
        <p className="mt-1 text-[12px] text-faint">{ago(item.minutesAgo)} ago</p>
      </div>
      {!item.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
    </div>
  );

  return item.ticker ? <Link href={`/stock/${item.ticker}`}>{body}</Link> : body;
}

export default function NotificationsPage() {
  const unread = NOTIFICATIONS.filter((n) => !n.read);
  const earlier = NOTIFICATIONS.filter((n) => n.read);

  return (
    <>
      <TopBar title="Notifications" large />
      <main className="mx-auto max-w-xl px-4 pb-8">
        {unread.length > 0 && (
          <section className="mt-4">
            <h2 className="mb-2.5 px-1 text-[13px] font-bold tracking-[0.1em] text-faint uppercase">
              New
            </h2>
            <Card className="divide-y divide-line-soft overflow-hidden">
              {unread.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </Card>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-2.5 px-1 text-[13px] font-bold tracking-[0.1em] text-faint uppercase">
            Earlier
          </h2>
          <Card className="divide-y divide-line-soft overflow-hidden">
            {earlier.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </Card>
        </section>
      </main>
    </>
  );
}

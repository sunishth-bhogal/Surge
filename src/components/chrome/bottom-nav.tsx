"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, Search, TrendingUp, User } from "lucide-react";
import { NOTIFICATIONS } from "@/data/social";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-40 border-t border-line-soft bg-ink/88 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-xl">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  active ? "text-bright" : "text-faint hover:text-muted"
                }`}
              >
                <span className="relative">
                  <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                  {href === "/notifications" && unread > 0 && (
                    <span className="absolute -top-0.5 -right-1.5 grid min-w-[15px] place-items-center rounded-full bg-down px-1 text-[9.5px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </span>
                <span className="text-[10.5px] font-semibold tracking-[-0.01em]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/chrome/bottom-nav";

/** Onboarding owns the full screen; everything else gets the tab bar. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const bare = pathname.startsWith("/welcome");

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1">{children}</div>
      {!bare && <BottomNav />}
    </div>
  );
}

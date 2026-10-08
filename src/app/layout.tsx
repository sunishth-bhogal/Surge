import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppStateProvider } from "@/components/app-state";
import { AppShell } from "@/components/chrome/app-shell";
import { LiveProvider } from "@/components/live/live-provider";

export const metadata: Metadata = {
  title: "Splash — Markets, live",
  description:
    "The social layer for the stock market. Follow the market together: live prices, market events, reactions and community predictions.",
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>
          <LiveProvider>
            <AppShell>{children}</AppShell>
          </LiveProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}

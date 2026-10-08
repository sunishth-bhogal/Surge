import { TopBar } from "@/components/chrome/top-bar";
import { LeaderboardTable } from "@/components/profile/leaderboard-table";

export default function LeaderboardPage() {
  return (
    <>
      <TopBar title="Leaderboard" large />
      <main className="mx-auto max-w-xl px-4 pt-4 pb-8">
        <LeaderboardTable />
      </main>
    </>
  );
}

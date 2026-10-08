import { notFound } from "next/navigation";
import { TopBar } from "@/components/chrome/top-bar";
import { ProfileView } from "@/components/profile/profile-view";
import { ALL_USERS } from "@/data/leaderboard";
import { CURRENT_USER_ID } from "@/data/social";

import { USERS } from "@/data/social";

/** Authored accounts prerender; generated leaderboard profiles render on demand. */
export function generateStaticParams() {
  return USERS.map((u) => ({ username: u.username }));
}

export default async function UserProfilePage({ params }: PageProps<"/profile/[username]">) {
  const { username } = await params;
  const user = ALL_USERS.find((u) => u.username === username.toLowerCase());
  if (!user) notFound();

  return (
    <>
      <TopBar title={`@${user.username}`} subtitle={user.level} back="/search" />
      <ProfileView user={user} isSelf={user.id === CURRENT_USER_ID} />
    </>
  );
}

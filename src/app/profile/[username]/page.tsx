import { notFound } from "next/navigation";
import { TopBar } from "@/components/chrome/top-bar";
import { ProfileView } from "@/components/profile/profile-view";
import { CURRENT_USER_ID, USERS } from "@/data/social";

export function generateStaticParams() {
  return USERS.map((u) => ({ username: u.username }));
}

export default async function UserProfilePage({ params }: PageProps<"/profile/[username]">) {
  const { username } = await params;
  const user = USERS.find((u) => u.username === username.toLowerCase());
  if (!user) notFound();

  return (
    <>
      <TopBar title={`@${user.username}`} subtitle={user.level} back="/search" />
      <ProfileView user={user} isSelf={user.id === CURRENT_USER_ID} />
    </>
  );
}

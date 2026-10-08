import { Settings } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/chrome/top-bar";
import { ProfileView } from "@/components/profile/profile-view";
import { currentUser } from "@/data/social";

export default function MyProfilePage() {
  const user = currentUser();
  return (
    <>
      <TopBar
        title="Profile"
        large
        right={
          <Link
            href="/welcome"
            aria-label="Redo onboarding"
            className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-raised hover:text-bright"
          >
            <Settings size={19} strokeWidth={2.1} />
          </Link>
        }
      />
      <ProfileView user={user} isSelf />
    </>
  );
}

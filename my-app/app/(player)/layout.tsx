import { getSessionUser } from "@/lib/auth/guards";
import { UswHeader } from "@/components/usw/header";
import { UswBottomNav } from "@/components/usw/bottom-nav";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const isAdmin = user?.role === "TOURNAMENT_ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen flex-col">
      <UswHeader />
      <main className="flex-1 px-4 pb-24 pt-24 sm:px-8 sm:pb-12">{children}</main>
      <UswBottomNav isLoggedIn={Boolean(user)} isAdmin={isAdmin} />
    </div>
  );
}

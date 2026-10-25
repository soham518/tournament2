import { spaceGrotesk, spaceMono } from "@/lib/fonts";
import { getSessionUser } from "@/lib/auth/guards";
import { UswHeader } from "@/components/usw/header";
import { UswBottomNav } from "@/components/usw/bottom-nav";
import "@/app/usw-theme.css";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <div className={`usw-theme ${spaceGrotesk.variable} ${spaceMono.variable} flex min-h-screen flex-col`}>
      <UswHeader />
      <main className="flex-1 px-4 pb-24 pt-24 sm:px-8 sm:pb-12">{children}</main>
      <UswBottomNav isLoggedIn={Boolean(user)} />
    </div>
  );
}

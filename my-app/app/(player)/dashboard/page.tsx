import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-2">
      <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
        [Warrior Dossier]
      </span>
      <h1 className="font-[family-name:var(--font-space-grotesk)] mb-1 mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Welcome, {user.name}
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
        Playing as {profile.sfaInGameName} ({profile.sfaPlayerId})
      </p>
    </div>
  );
}

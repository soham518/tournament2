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
    <div className="mx-auto w-full max-w-2xl py-16">
      <h1 className="mb-1 text-2xl font-semibold">Welcome, {user.name}</h1>
      <p className="text-sm text-muted-foreground">
        Playing as {profile.sfaInGameName} ({profile.sfaPlayerId})
      </p>
    </div>
  );
}

import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto w-full max-w-sm py-16">
      <h1 className="mb-1 text-2xl font-semibold">Complete your player profile</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        We need your Shadow Fight Arena details before you can register for tournaments.
      </p>
      <OnboardingForm
        defaultValues={
          profile
            ? {
                sfaInGameName: profile.sfaInGameName,
                sfaPlayerId: profile.sfaPlayerId,
                discordId: profile.discordId ?? "",
                platform: profile.platform ?? undefined,
                bio: profile.bio ?? "",
              }
            : undefined
        }
      />
    </div>
  );
}

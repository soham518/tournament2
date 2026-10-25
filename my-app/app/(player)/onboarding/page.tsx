import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto w-full max-w-sm py-8">
      <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
        [Warrior Dossier // Setup]
      </span>
      <h1 className="font-[family-name:var(--font-space-grotesk)] mb-1 mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Complete your profile
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] mb-6 text-sm text-[var(--usw-on-surface-variant)]">
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

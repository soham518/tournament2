import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { canAcceptRegistrations } from "@/lib/tournaments/status";
import { formatPaiseAsInr } from "@/lib/money";
import { UswPanel } from "@/components/usw/panel";
import { UswBadge } from "@/components/usw/badge";
import { UswButton } from "@/components/usw/button";
import { RegisterButton } from "@/app/(player)/tournaments/[slug]/register-button";

// Mirrors ACTIVE_REGISTRATION_STATUSES in lib/actions/registration.ts — a
// player "has" a tournament as long as their registration hasn't been
// rejected/expired/cancelled/withdrawn.
const ACTIVE_REGISTRATION_STATUSES = ["PENDING", "APPROVED", "WAITLISTED"] as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });

  if (!profile) {
    redirect("/onboarding");
  }

  const myRegistration = await prisma.tournamentRegistration.findFirst({
    where: { playerId: user.id, status: { in: [...ACTIVE_REGISTRATION_STATUSES] } },
    include: { tournament: true },
    orderBy: { registeredAt: "desc" },
  });

  const openTournaments = myRegistration
    ? []
    : await prisma.tournament
        .findMany({
          where: { status: "PUBLISHED" },
          include: { _count: { select: { registrations: { where: { status: "APPROVED" } } } } },
          orderBy: { startAt: "asc" },
        })
        .then((tournaments) =>
          tournaments.filter((t) => canAcceptRegistrations(t, t._count.registrations))
        );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-2">
      <div>
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

      {myRegistration ? (
        <UswPanel className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/tournaments/${myRegistration.tournament.slug}`}
              className="font-[family-name:var(--font-space-grotesk)] text-base font-bold uppercase text-[var(--usw-on-surface)] hover:text-[var(--usw-secondary-fixed-dim)]"
            >
              {myRegistration.tournament.name}
            </Link>
            <UswBadge variant="secondary">{myRegistration.status}</UswBadge>
          </div>
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            {myRegistration.tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}
          </p>
          <UswButton href={`/tournaments/${myRegistration.tournament.slug}/bracket`}>
            View bracket
          </UswButton>
        </UswPanel>
      ) : (
        <div className="space-y-3">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold uppercase text-[var(--usw-on-surface)]">
            Open tournaments
          </h2>
          {openTournaments.length === 0 ? (
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              No tournaments are open for registration right now. Check back soon.
            </p>
          ) : (
            <div className="space-y-3">
              {openTournaments.map((tournament) => (
                <UswPanel key={tournament.id} className="space-y-3">
                  <Link
                    href={`/tournaments/${tournament.slug}`}
                    className="font-[family-name:var(--font-space-grotesk)] block text-base font-bold uppercase text-[var(--usw-on-surface)] hover:text-[var(--usw-secondary-fixed-dim)]"
                  >
                    {tournament.name}
                  </Link>
                  <div className="font-[family-name:var(--font-space-mono)] space-y-1 text-sm text-[var(--usw-on-surface-variant)]">
                    <p>{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</p>
                    <p>{tournament.isPaid ? formatPaiseAsInr(tournament.entryFeePaise) + " entry" : "Free entry"}</p>
                  </div>
                  <RegisterButton tournamentId={tournament.id} />
                </UswPanel>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

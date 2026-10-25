import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { computeDisplayStatus, canAcceptRegistrations, DISPLAY_STATUS_LABEL } from "@/lib/tournaments/status";
import { formatPaiseAsInr } from "@/lib/money";
import { UswBadge } from "@/components/usw/badge";
import { UswPanel } from "@/components/usw/panel";
import { RegisterButton } from "./register-button";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      paymentConfig: true,
      prizeDistributions: { orderBy: { position: "asc" } },
      allowedFighters: { include: { fighter: true } },
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
  });
  if (!tournament || tournament.status === "DRAFT") notFound();

  const user = await getSessionUser();
  const displayStatus = computeDisplayStatus(tournament, tournament._count.registrations);
  const canRegister = user?.role === "PLAYER" && canAcceptRegistrations(tournament, tournament._count.registrations);

  let existingRegistration = null;
  if (user) {
    existingRegistration = await prisma.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: user.id } },
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <UswBadge>{DISPLAY_STATUS_LABEL[displayStatus]}</UswBadge>
          <UswBadge variant="outline">{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</UswBadge>
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold uppercase text-[var(--usw-on-surface)]">
          {tournament.name}
        </h1>
        <p className="font-[family-name:var(--font-space-mono)] mt-2 text-[var(--usw-on-surface-variant)]">
          {tournament.description}
        </p>
        <Link
          href={`/tournaments/${tournament.slug}/bracket`}
          className="font-[family-name:var(--font-space-mono)] mt-2 inline-block text-sm text-[var(--usw-secondary-fixed-dim)] underline"
        >
          View bracket &amp; standings
        </Link>
      </div>

      <UswPanel className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Info label="Organizer" value={tournament.organizerName} />
        <Info label="Starts" value={tournament.startAt.toLocaleString()} />
        <Info
          label="Registration closes"
          value={tournament.registrationClosesAt.toLocaleString()}
        />
        <Info
          label="Capacity"
          value={`${tournament._count.registrations} / ${tournament.maxParticipants}`}
        />
        <Info label="Entry fee" value={tournament.isPaid ? formatPaiseAsInr(tournament.entryFeePaise) : "Free"} />
        <Info label="Structure" value={tournament.structureType.replace(/_/g, " ")} />
      </UswPanel>

      {tournament.prizePoolEnabled && (
        <section>
          <SectionHeading>Prize pool</SectionHeading>
          <p className="font-[family-name:var(--font-space-mono)] mb-2 text-sm text-[var(--usw-primary)]">
            Total: {formatPaiseAsInr(tournament.prizePoolAmountPaise)}
          </p>
          <ul className="font-[family-name:var(--font-space-mono)] space-y-1 text-sm text-[var(--usw-on-surface-variant)]">
            {tournament.prizeDistributions.map((d) => (
              <li key={d.position}>
                {d.label}: {d.valueType === "PERCENTAGE" ? `${d.value / 100}%` : formatPaiseAsInr(d.value)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHeading>Rules &amp; eligibility</SectionHeading>
        <ul className="font-[family-name:var(--font-space-mono)] space-y-1 text-sm text-[var(--usw-on-surface-variant)]">
          <li>Legendary fighters: {tournament.legendaryFightersAllowed ? "Allowed" : "Prohibited"}</li>
          {tournament.minAccountLevel && <li>Minimum account level: {tournament.minAccountLevel}</li>}
          {tournament.levelRuleEnabled && tournament.levelRuleDescription && (
            <li>{tournament.levelRuleDescription}</li>
          )}
          {tournament.eligibilityNotes && <li>{tournament.eligibilityNotes}</li>}
          {tournament.allowedFighters.length > 0 && (
            <li>
              Permitted fighters: {tournament.allowedFighters.map((a) => a.fighter.name).join(", ")}
            </li>
          )}
        </ul>
      </section>

      {tournament.isPaid && tournament.paymentConfig && (
        <section>
          <SectionHeading>Payment instructions</SectionHeading>
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            UPI ID: <span className="text-[var(--usw-on-surface)]">{tournament.paymentConfig.upiId}</span> · Payee:{" "}
            {tournament.paymentConfig.payeeName}
          </p>
          {tournament.paymentConfig.instructions && (
            <p className="font-[family-name:var(--font-space-mono)] mt-1 text-sm text-[var(--usw-on-surface-variant)]">
              {tournament.paymentConfig.instructions}
            </p>
          )}
        </section>
      )}

      <section className="font-[family-name:var(--font-space-mono)] text-sm">
        {!user && <p className="text-[var(--usw-on-surface-variant)]">Log in to register.</p>}
        {existingRegistration && (
          <p className="text-[var(--usw-on-surface)]">
            You are registered.{" "}
            <Link
              href={`/dashboard/registrations/${existingRegistration.id}`}
              className="text-[var(--usw-secondary-fixed-dim)] underline"
            >
              View your registration
            </Link>
          </p>
        )}
        {user && !existingRegistration && canRegister && <RegisterButton tournamentId={tournament.id} />}
        {user && !existingRegistration && !canRegister && (
          <p className="text-[var(--usw-on-surface-variant)]">Registration is not currently open.</p>
        )}
      </section>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-[family-name:var(--font-space-grotesk)] mb-2 text-lg font-bold uppercase text-[var(--usw-on-surface)]">
      {children}
    </h2>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-[family-name:var(--font-space-mono)] text-[10px] uppercase text-[var(--usw-outline)]">
        {label}
      </p>
      <p className="font-[family-name:var(--font-space-mono)] text-sm font-bold text-[var(--usw-on-surface)]">
        {value}
      </p>
    </div>
  );
}

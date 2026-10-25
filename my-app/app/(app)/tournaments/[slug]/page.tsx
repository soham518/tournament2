import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/guards";
import { computeDisplayStatus, canAcceptRegistrations, DISPLAY_STATUS_LABEL } from "@/lib/tournaments/status";
import { formatPaiseAsInr } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto w-full max-w-3xl space-y-8 py-16">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary">{DISPLAY_STATUS_LABEL[displayStatus]}</Badge>
          <Badge variant="outline">{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</Badge>
        </div>
        <h1 className="text-3xl font-semibold">{tournament.name}</h1>
        <p className="mt-2 text-muted-foreground">{tournament.description}</p>
        <Link href={`/tournaments/${tournament.slug}/bracket`} className="mt-2 inline-block text-sm underline">
          View bracket &amp; standings
        </Link>
      </div>

      <section className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
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
      </section>

      {tournament.prizePoolEnabled && (
        <section>
          <h2 className="mb-2 text-lg font-medium">Prize pool</h2>
          <p className="mb-2 text-sm text-muted-foreground">
            Total: {formatPaiseAsInr(tournament.prizePoolAmountPaise)}
          </p>
          <ul className="space-y-1 text-sm">
            {tournament.prizeDistributions.map((d) => (
              <li key={d.position}>
                {d.label}: {d.valueType === "PERCENTAGE" ? `${d.value / 100}%` : formatPaiseAsInr(d.value)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-medium">Rules &amp; eligibility</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
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
          <h2 className="mb-2 text-lg font-medium">Payment instructions</h2>
          <p className="text-sm text-muted-foreground">
            UPI ID: <span className="font-mono">{tournament.paymentConfig.upiId}</span> · Payee:{" "}
            {tournament.paymentConfig.payeeName}
          </p>
          {tournament.paymentConfig.instructions && (
            <p className="mt-1 text-sm text-muted-foreground">{tournament.paymentConfig.instructions}</p>
          )}
        </section>
      )}

      <section>
        {!user && <p className="text-sm text-muted-foreground">Log in to register.</p>}
        {existingRegistration && (
          <p className="text-sm">
            You are registered.{" "}
            <Link href={`/dashboard/registrations/${existingRegistration.id}`} className="underline">
              View your registration
            </Link>
          </p>
        )}
        {user && !existingRegistration && canRegister && <RegisterButton tournamentId={tournament.id} />}
        {user && !existingRegistration && !canRegister && (
          <p className="text-sm text-muted-foreground">Registration is not currently open.</p>
        )}
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

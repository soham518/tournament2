import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UswBadge } from "@/components/usw/badge";
import {
  UswTable,
  UswTableBody,
  UswTableCell,
  UswTableHead,
  UswTableHeader,
  UswTableRow,
} from "@/components/usw/table";
import { RegistrationActions } from "./registration-actions";

export default async function AdminRegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournamentAdmin(id);

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
  if (!tournament) notFound();

  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: id },
    include: { player: { select: { username: true, playerProfile: true } } },
    orderBy: { registeredAt: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Registrations
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
        {tournament.name}
      </p>

      {registrations.length === 0 ? (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          No registrations yet.
        </p>
      ) : (
        <UswTable>
          <UswTableHeader>
            <UswTableRow>
              <UswTableHead>Player</UswTableHead>
              <UswTableHead>In-game name</UswTableHead>
              <UswTableHead>Status</UswTableHead>
              <UswTableHead>Payment</UswTableHead>
              <UswTableHead>Registered</UswTableHead>
              <UswTableHead>Actions</UswTableHead>
            </UswTableRow>
          </UswTableHeader>
          <UswTableBody>
            {registrations.map((registration) => (
              <UswTableRow key={registration.id}>
                <UswTableCell className="font-bold">{registration.player.username}</UswTableCell>
                <UswTableCell>{registration.player.playerProfile?.sfaInGameName ?? "—"}</UswTableCell>
                <UswTableCell>
                  <UswBadge variant="secondary">{registration.status}</UswBadge>
                </UswTableCell>
                <UswTableCell>{registration.paymentStatus}</UswTableCell>
                <UswTableCell>{registration.registeredAt.toLocaleDateString()}</UswTableCell>
                <UswTableCell>
                  {registration.status === "PENDING" ? (
                    <RegistrationActions registrationId={registration.id} />
                  ) : (
                    <span className="text-xs text-[var(--usw-on-surface-variant)]">—</span>
                  )}
                </UswTableCell>
              </UswTableRow>
            ))}
          </UswTableBody>
        </UswTable>
      )}
    </div>
  );
}

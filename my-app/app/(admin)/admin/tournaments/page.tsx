import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeDisplayStatus, DISPLAY_STATUS_LABEL } from "@/lib/tournaments/status";
import { UswBadge } from "@/components/usw/badge";
import { UswButton } from "@/components/usw/button";
import {
  UswTable,
  UswTableBody,
  UswTableCell,
  UswTableHead,
  UswTableHeader,
  UswTableRow,
} from "@/components/usw/table";
import { CreateTournamentDialog } from "./create-dialog";

export default async function AdminTournamentsPage() {
  const user = await requireRole(["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);

  const tournaments = await prisma.tournament.findMany({
    where:
      user.role === "SUPER_ADMIN"
        ? {}
        : { OR: [{ ownerId: user.id }, { adminPermissions: { some: { userId: user.id } } }] },
    include: {
      _count: {
        select: { registrations: { where: { status: "APPROVED" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
            [Operations]
          </span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
            Tournaments
          </h1>
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            Create and manage your tournaments.
          </p>
        </div>
        <CreateTournamentDialog />
      </div>

      {tournaments.length === 0 ? (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          No tournaments yet. Create your first one above.
        </p>
      ) : (
        <UswTable>
          <UswTableHeader>
            <UswTableRow>
              <UswTableHead>Name</UswTableHead>
              <UswTableHead>Mode</UswTableHead>
              <UswTableHead>Status</UswTableHead>
              <UswTableHead>Registrations</UswTableHead>
              <UswTableHead className="text-right">Actions</UswTableHead>
            </UswTableRow>
          </UswTableHeader>
          <UswTableBody>
            {tournaments.map((tournament) => {
              const status = computeDisplayStatus(tournament, tournament._count.registrations);
              return (
                <UswTableRow key={tournament.id}>
                  <UswTableCell className="font-bold">{tournament.name}</UswTableCell>
                  <UswTableCell>{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</UswTableCell>
                  <UswTableCell>
                    <UswBadge variant="secondary">{DISPLAY_STATUS_LABEL[status]}</UswBadge>
                  </UswTableCell>
                  <UswTableCell>
                    {tournament._count.registrations} / {tournament.maxParticipants}
                  </UswTableCell>
                  <UswTableCell className="text-right">
                    <UswButton variant="ghost" size="sm" href={`/admin/tournaments/${tournament.id}/edit`}>
                      Manage
                    </UswButton>
                  </UswTableCell>
                </UswTableRow>
              );
            })}
          </UswTableBody>
        </UswTable>
      )}
    </div>
  );
}

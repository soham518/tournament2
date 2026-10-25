import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { cn } from "cn";
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

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "WAITLISTED"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default async function AdminRegistrationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  await requireTournamentAdmin(id);

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
  if (!tournament) notFound();

  const activeFilter: StatusFilter = STATUS_FILTERS.includes(status as StatusFilter)
    ? (status as StatusFilter)
    : "ALL";

  const allRegistrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: id },
    include: { player: { select: { username: true, playerProfile: true } } },
    orderBy: { registeredAt: "asc" },
  });

  const counts: Record<StatusFilter, number> = {
    ALL: allRegistrations.length,
    PENDING: allRegistrations.filter((r) => r.status === "PENDING").length,
    APPROVED: allRegistrations.filter((r) => r.status === "APPROVED").length,
    WAITLISTED: allRegistrations.filter((r) => r.status === "WAITLISTED").length,
  };

  const registrations =
    activeFilter === "ALL" ? allRegistrations : allRegistrations.filter((r) => r.status === activeFilter);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Registrations
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
        {tournament.name}
      </p>

      <div className="font-[family-name:var(--font-space-mono)] flex gap-1 overflow-x-auto border-b border-white/5 pb-px text-[11px] font-bold uppercase tracking-wider">
        {STATUS_FILTERS.map((filter) => (
          <Link
            key={filter}
            href={filter === "ALL" ? `/admin/tournaments/${id}/registrations` : `/admin/tournaments/${id}/registrations?status=${filter}`}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 transition-colors",
              activeFilter === filter
                ? "border-[var(--usw-secondary-fixed-dim)] text-[var(--usw-on-surface)]"
                : "border-transparent text-[var(--usw-on-surface-variant)] hover:text-[var(--usw-on-surface)]"
            )}
          >
            {filter === "ALL" ? "All" : filter.charAt(0) + filter.slice(1).toLowerCase()} ({counts[filter]})
          </Link>
        ))}
      </div>

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
                  {registration.status === "PENDING" || registration.status === "WAITLISTED" ? (
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

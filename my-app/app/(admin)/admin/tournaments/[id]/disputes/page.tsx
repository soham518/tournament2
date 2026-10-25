import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UswBadge } from "@/components/usw/badge";
import { UswPanel } from "@/components/usw/panel";
import { ResolveDisputeForm } from "./resolve-form";

export default async function DisputesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireTournamentAdmin(id);

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
  if (!tournament) notFound();

  const disputes = await prisma.dispute.findMany({
    where: { tournamentId: id },
    include: { openedBy: { select: { username: true } }, match: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Disputes
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
        {tournament.name}
      </p>

      {disputes.length === 0 ? (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          No disputes.
        </p>
      ) : (
        disputes.map((dispute) => (
          <UswPanel key={dispute.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-space-mono)] text-sm font-bold text-[var(--usw-on-surface)]">
                Opened by {dispute.openedBy.username}
              </p>
              <UswBadge variant={dispute.status === "OPEN" ? "default" : "secondary"}>{dispute.status}</UswBadge>
            </div>
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              {dispute.reason}
            </p>
            {dispute.status === "OPEN" ? (
              <ResolveDisputeForm disputeId={dispute.id} />
            ) : (
              <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
                Resolution: {dispute.resolution}
              </p>
            )}
          </UswPanel>
        ))
      )}
    </div>
  );
}

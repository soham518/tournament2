import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto w-full max-w-3xl space-y-4 py-16">
      <h1 className="text-2xl font-semibold">Disputes</h1>
      <p className="text-sm text-muted-foreground">{tournament.name}</p>

      {disputes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No disputes.</p>
      ) : (
        disputes.map((dispute) => (
          <div key={dispute.id} className="space-y-2 rounded-md border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Opened by {dispute.openedBy.username}</p>
              <Badge variant={dispute.status === "OPEN" ? "default" : "secondary"}>{dispute.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{dispute.reason}</p>
            {dispute.status === "OPEN" ? (
              <ResolveDisputeForm disputeId={dispute.id} />
            ) : (
              <p className="text-sm text-muted-foreground">Resolution: {dispute.resolution}</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

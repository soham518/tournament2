import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeDisplayStatus, DISPLAY_STATUS_LABEL } from "@/lib/tournaments/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="mx-auto w-full max-w-5xl py-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tournaments</h1>
          <p className="text-sm text-muted-foreground">Create and manage your tournaments.</p>
        </div>
        <CreateTournamentDialog />
      </div>

      {tournaments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tournaments yet. Create your first one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((tournament) => {
              const status = computeDisplayStatus(tournament, tournament._count.registrations);
              return (
                <TableRow key={tournament.id}>
                  <TableCell className="font-medium">{tournament.name}</TableCell>
                  <TableCell>{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{DISPLAY_STATUS_LABEL[status]}</Badge>
                  </TableCell>
                  <TableCell>
                    {tournament._count.registrations} / {tournament.maxParticipants}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/admin/tournaments/${tournament.id}/edit`}>Manage</Link>}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

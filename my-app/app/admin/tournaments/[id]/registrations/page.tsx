import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="mx-auto w-full max-w-5xl space-y-4 py-16">
      <h1 className="text-2xl font-semibold">Registrations</h1>
      <p className="text-sm text-muted-foreground">{tournament.name}</p>

      {registrations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No registrations yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>In-game name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">{registration.player.username}</TableCell>
                <TableCell>{registration.player.playerProfile?.sfaInGameName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{registration.status}</Badge>
                </TableCell>
                <TableCell>{registration.paymentStatus}</TableCell>
                <TableCell>{registration.registeredAt.toLocaleDateString()}</TableCell>
                <TableCell>
                  {registration.status === "PENDING" ? (
                    <RegistrationActions registrationId={registration.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

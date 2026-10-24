import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatPaiseAsInr } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentActions } from "./payment-actions";

export default async function PaymentVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournamentAdmin(id);

  const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true } });
  if (!tournament) notFound();

  const payments = await prisma.payment.findMany({
    where: { registration: { tournamentId: id } },
    include: {
      registration: {
        include: { player: { select: { username: true, playerProfile: true } } },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl py-16">
      <h1 className="mb-1 text-2xl font-semibold">Payment verification</h1>
      <p className="mb-6 text-sm text-muted-foreground">{tournament.name}</p>

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment submissions yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>In-game name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.registration.player.username}</TableCell>
                <TableCell>{payment.registration.player.playerProfile?.sfaInGameName ?? "—"}</TableCell>
                <TableCell>{formatPaiseAsInr(payment.amountPaise)}</TableCell>
                <TableCell className="font-mono text-xs">{payment.transactionRef ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={payment.status === "VERIFIED" ? "default" : "secondary"}>
                    {payment.status}
                    {payment.isFlagged ? " · Flagged" : ""}
                  </Badge>
                </TableCell>
                <TableCell>{payment.submittedAt.toLocaleString()}</TableCell>
                <TableCell>
                  {payment.status === "PENDING_VERIFICATION" ? (
                    <PaymentActions paymentId={payment.id} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {payment.status === "VERIFIED" ? "Verified" : "Rejected"}
                    </span>
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

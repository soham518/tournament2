import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatPaiseAsInr } from "@/lib/money";
import { UswBadge } from "@/components/usw/badge";
import {
  UswTable,
  UswTableBody,
  UswTableCell,
  UswTableHead,
  UswTableHeader,
  UswTableRow,
} from "@/components/usw/table";
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
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="font-[family-name:var(--font-space-grotesk)] mb-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Payment verification
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] mb-6 text-sm text-[var(--usw-on-surface-variant)]">
        {tournament.name}
      </p>

      {payments.length === 0 ? (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          No payment submissions yet.
        </p>
      ) : (
        <UswTable>
          <UswTableHeader>
            <UswTableRow>
              <UswTableHead>Player</UswTableHead>
              <UswTableHead>In-game name</UswTableHead>
              <UswTableHead>Amount</UswTableHead>
              <UswTableHead>Transaction ref</UswTableHead>
              <UswTableHead>Status</UswTableHead>
              <UswTableHead>Submitted</UswTableHead>
              <UswTableHead>Actions</UswTableHead>
            </UswTableRow>
          </UswTableHeader>
          <UswTableBody>
            {payments.map((payment) => (
              <UswTableRow key={payment.id}>
                <UswTableCell className="font-bold">{payment.registration.player.username}</UswTableCell>
                <UswTableCell>{payment.registration.player.playerProfile?.sfaInGameName ?? "—"}</UswTableCell>
                <UswTableCell>{formatPaiseAsInr(payment.amountPaise)}</UswTableCell>
                <UswTableCell className="text-xs">{payment.transactionRef ?? "—"}</UswTableCell>
                <UswTableCell>
                  <UswBadge variant={payment.status === "VERIFIED" ? "default" : "secondary"}>
                    {payment.status}
                    {payment.isFlagged ? " · Flagged" : ""}
                  </UswBadge>
                </UswTableCell>
                <UswTableCell>{payment.submittedAt.toLocaleString()}</UswTableCell>
                <UswTableCell>
                  {payment.status === "PENDING_VERIFICATION" ? (
                    <PaymentActions paymentId={payment.id} />
                  ) : (
                    <span className="text-xs text-[var(--usw-on-surface-variant)]">
                      {payment.status === "VERIFIED" ? "Verified" : "Rejected"}
                    </span>
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

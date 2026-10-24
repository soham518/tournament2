import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatPaiseAsInr } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { PaymentProofForm } from "./payment-proof-form";
import { CopyUpiButton } from "./copy-upi-button";
import { WithdrawButton } from "./withdraw-button";

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id },
    include: { tournament: { include: { paymentConfig: true } }, payment: true },
  });
  if (!registration || registration.playerId !== user.id) notFound();

  const { tournament } = registration;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 py-16">
      <div>
        <Link href={`/tournaments/${tournament.slug}`} className="text-sm text-muted-foreground underline">
          ← {tournament.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Your registration</h1>
      </div>

      <div className="flex gap-2">
        <Badge variant="secondary">Registration: {registration.status}</Badge>
        <Badge variant="secondary">Payment: {registration.paymentStatus}</Badge>
      </div>

      {tournament.isPaid && tournament.paymentConfig && (
        <section className="space-y-3 rounded-md border p-4">
          <h2 className="font-medium">Payment instructions</h2>
          <p className="text-sm">Amount due: {formatPaiseAsInr(tournament.entryFeePaise)}</p>
          <p className="text-sm">
            UPI ID: <span className="font-mono">{tournament.paymentConfig.upiId}</span>
          </p>
          <CopyUpiButton upiId={tournament.paymentConfig.upiId} />
          <p className="text-sm">Payee: {tournament.paymentConfig.payeeName}</p>
          {tournament.paymentConfig.qrCodeImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tournament.paymentConfig.qrCodeImageUrl}
              alt="Payment QR code"
              className="h-48 w-48 rounded-md border object-contain"
            />
          )}
          {tournament.paymentConfig.instructions && (
            <p className="text-sm text-muted-foreground">{tournament.paymentConfig.instructions}</p>
          )}
          {tournament.paymentConfig.submissionDeadlineAt && (
            <p className="text-sm text-muted-foreground">
              Submit by {tournament.paymentConfig.submissionDeadlineAt.toLocaleString()}
            </p>
          )}
          {tournament.paymentConfig.screenshotDiscordUrl && (
            <p className="text-sm">
              After paying, share a screenshot in{" "}
              <a
                href={tournament.paymentConfig.screenshotDiscordUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                the organizer&apos;s Discord
              </a>
              .
            </p>
          )}

          {registration.payment?.status === "PENDING_VERIFICATION" ? (
            <p className="text-sm text-muted-foreground">
              Payment verification is pending. This does not yet confirm your registration.
            </p>
          ) : registration.payment?.status === "VERIFIED" ? (
            <p className="text-sm text-emerald-600">Payment verified.</p>
          ) : registration.payment?.status === "REJECTED" ? (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                Payment rejected: {registration.payment.rejectionReason}
              </p>
              <PaymentProofForm registrationId={registration.id} />
            </div>
          ) : (
            <PaymentProofForm registrationId={registration.id} />
          )}
        </section>
      )}

      {registration.status !== "WITHDRAWN" &&
        registration.status !== "CANCELLED" &&
        registration.status !== "EXPIRED" && <WithdrawButton registrationId={registration.id} />}
    </div>
  );
}

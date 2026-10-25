import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { formatPaiseAsInr } from "@/lib/money";
import { UswBadge } from "@/components/usw/badge";
import { UswPanel } from "@/components/usw/panel";
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
    <div className="mx-auto w-full max-w-2xl space-y-6 py-2">
      <div>
        <Link
          href={`/tournaments/${tournament.slug}`}
          className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)] underline"
        >
          ← {tournament.name}
        </Link>
        <h1 className="font-[family-name:var(--font-space-grotesk)] mt-2 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
          Your registration
        </h1>
      </div>

      <div className="flex gap-2">
        <UswBadge variant="secondary">Registration: {registration.status}</UswBadge>
        <UswBadge variant="secondary">Payment: {registration.paymentStatus}</UswBadge>
      </div>

      {tournament.isPaid && tournament.paymentConfig && (
        <UswPanel className="space-y-3">
          <h2 className="font-[family-name:var(--font-space-grotesk)] font-bold uppercase text-[var(--usw-on-surface)]">
            Payment instructions
          </h2>
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            Amount due: <span className="text-[var(--usw-primary)]">{formatPaiseAsInr(tournament.entryFeePaise)}</span>
          </p>
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            UPI ID: <span className="text-[var(--usw-on-surface)]">{tournament.paymentConfig.upiId}</span>
          </p>
          <CopyUpiButton upiId={tournament.paymentConfig.upiId} />
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            Payee: {tournament.paymentConfig.payeeName}
          </p>
          {tournament.paymentConfig.qrCodeImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tournament.paymentConfig.qrCodeImageUrl}
              alt="Payment QR code"
              className="h-48 w-48 object-contain ring-1 ring-[var(--usw-outline-variant)]"
            />
          )}
          {tournament.paymentConfig.instructions && (
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              {tournament.paymentConfig.instructions}
            </p>
          )}
          {tournament.paymentConfig.submissionDeadlineAt && (
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              Submit by {tournament.paymentConfig.submissionDeadlineAt.toLocaleString()}
            </p>
          )}
          {tournament.paymentConfig.screenshotDiscordUrl && (
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              After paying, share a screenshot in{" "}
              <a
                href={tournament.paymentConfig.screenshotDiscordUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--usw-secondary-fixed-dim)] underline"
              >
                the organizer&apos;s Discord
              </a>
              .
            </p>
          )}

          {registration.payment?.status === "PENDING_VERIFICATION" ? (
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
              Payment verification is pending. This does not yet confirm your registration.
            </p>
          ) : registration.payment?.status === "VERIFIED" ? (
            <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-secondary-fixed-dim)]">
              Payment verified.
            </p>
          ) : registration.payment?.status === "REJECTED" ? (
            <div className="space-y-2">
              <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-error)]">
                Payment rejected: {registration.payment.rejectionReason}
              </p>
              <PaymentProofForm registrationId={registration.id} />
            </div>
          ) : (
            <PaymentProofForm registrationId={registration.id} />
          )}
        </UswPanel>
      )}

      {registration.status !== "WITHDRAWN" &&
        registration.status !== "CANCELLED" &&
        registration.status !== "EXPIRED" && <WithdrawButton registrationId={registration.id} />}
    </div>
  );
}

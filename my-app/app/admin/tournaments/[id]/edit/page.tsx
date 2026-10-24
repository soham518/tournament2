import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { toDateTimeLocalValue } from "@/lib/dates";
import { paiseToRupees } from "@/lib/money";
import { computeDisplayStatus } from "@/lib/tournaments/status";
import { TournamentEditor } from "./editor";

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournamentAdmin(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      paymentConfig: true,
      prizeDistributions: { orderBy: { position: "asc" } },
      allowedFighters: true,
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
  });
  if (!tournament) notFound();

  const fighters = await prisma.fighter.findMany({ orderBy: { name: "asc" } });
  const displayStatus = computeDisplayStatus(tournament, tournament._count.registrations);

  return (
    <div className="mx-auto w-full max-w-3xl py-16">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tournament.name}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href={`/admin/tournaments/${tournament.id}/registrations`} className="underline">
            Registrations
          </Link>
          <Link href={`/admin/tournaments/${tournament.id}/payments`} className="underline">
            Payments
          </Link>
          <Link href={`/admin/tournaments/${tournament.id}/bracket`} className="underline">
            Bracket
          </Link>
          <Link href={`/admin/tournaments/${tournament.id}/disputes`} className="underline">
            Disputes
          </Link>
        </div>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Configure every aspect of this tournament, then publish when ready.
      </p>
      <TournamentEditor
        tournamentId={tournament.id}
        mode={tournament.mode}
        slug={tournament.slug}
        status={tournament.status}
        displayStatus={displayStatus}
        fighters={fighters}
        basicsDefaults={{
          name: tournament.name,
          description: tournament.description,
          coverImageUrl: tournament.coverImageUrl ?? "",
          organizerName: tournament.organizerName,
          startAt: toDateTimeLocalValue(tournament.startAt),
          endAt: toDateTimeLocalValue(tournament.endAt),
          timezone: tournament.timezone,
          contactInfo: tournament.contactInfo ?? "",
          instructions: tournament.instructions ?? "",
          mode: tournament.mode,
          preset: tournament.preset,
        }}
        rulesDefaults={{
          legendaryFightersAllowed: tournament.legendaryFightersAllowed,
          minAccountLevel: tournament.minAccountLevel ?? "",
          eligibilityNotes: tournament.eligibilityNotes ?? "",
          levelRuleEnabled: tournament.levelRuleEnabled,
          levelRuleDescription: tournament.levelRuleDescription ?? "",
          levelRuleRequiresVerification: tournament.levelRuleRequiresVerification,
          rosterMinLevel: tournament.rosterMinLevel ?? "",
          rosterLevelAppliesToAllFighters: tournament.rosterLevelAppliesToAllFighters,
          allowedFighterIds: tournament.allowedFighters.map((f) => f.fighterId),
        }}
        registrationDefaults={{
          registrationOpensAt: toDateTimeLocalValue(tournament.registrationOpensAt),
          registrationClosesAt: toDateTimeLocalValue(tournament.registrationClosesAt),
          maxParticipants: tournament.maxParticipants,
          minParticipants: tournament.minParticipants ?? "",
          waitlistEnabled: tournament.waitlistEnabled,
          approvalMode: tournament.approvalMode,
          paymentDeadlineMinutes: tournament.paymentDeadlineMinutes ?? "",
          checkInEnabled: tournament.checkInEnabled,
          checkInOpensBeforeMinutes: tournament.checkInOpensBeforeMinutes ?? "",
        }}
        paymentDefaults={{
          isPaid: tournament.isPaid,
          entryFeeRupees: paiseToRupees(tournament.entryFeePaise),
          upiId: tournament.paymentConfig?.upiId ?? "",
          payeeName: tournament.paymentConfig?.payeeName ?? "",
          qrCodeImageUrl: tournament.paymentConfig?.qrCodeImageUrl ?? "",
          instructions: tournament.paymentConfig?.instructions ?? "",
          submissionDeadlineAt: toDateTimeLocalValue(tournament.paymentConfig?.submissionDeadlineAt),
          transactionRefRequired: tournament.paymentConfig?.transactionRefRequired ?? true,
          screenshotDiscordUrl: tournament.paymentConfig?.screenshotDiscordUrl ?? "",
          refundPolicy: tournament.paymentConfig?.refundPolicy ?? "",
        }}
        prizeDefaults={{
          prizePoolEnabled: tournament.prizePoolEnabled,
          prizePoolAmountRupees: paiseToRupees(tournament.prizePoolAmountPaise),
          prizeFundingType: tournament.prizeFundingType ?? "GUARANTEED",
          prizeRevenuePercent: tournament.prizeRevenuePercent?.toString() ?? "",
          distributions: tournament.prizeDistributions.map((d) => ({
            position: d.position,
            label: d.label,
            valueType: d.valueType,
            valueInput: (d.value / 100).toString(),
          })),
        }}
        structureDefaults={{
          structureType: tournament.structureType,
          seedingMethod: tournament.seedingMethod,
          hasThirdPlaceMatch: tournament.hasThirdPlaceMatch,
          groupSize: tournament.groupSize ?? "",
          advancesPerGroup: tournament.advancesPerGroup ?? "",
        }}
      />
    </div>
  );
}

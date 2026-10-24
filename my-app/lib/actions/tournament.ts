"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireTournamentAdmin } from "@/lib/auth/guards";
import {
  basicsSchema,
  rulesSchema,
  registrationSettingsSchema,
  paymentConfigSchema,
  prizePoolSchema,
  structureSchema,
} from "@/lib/validations/tournament";

export type TournamentActionResult = { success: true } | { success: false; error: string };

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

export async function createDraftTournamentAction(input: {
  name: string;
  mode: "ONE_V_ONE" | "THREE_V_THREE";
  preset: "SOLO_FIXED" | "SOLO_FLEXIBLE" | "THREE_V_THREE_FIXED" | "THREE_V_THREE_FLEXIBLE";
  structureType: "KNOCKOUT" | "GROUP" | "GROUP_THEN_KNOCKOUT";
  startAt: string;
  maxParticipants: number;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const user = await requireRole(["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);

  const soloPresets = new Set(["SOLO_FIXED", "SOLO_FLEXIBLE"]);
  const isSoloPreset = soloPresets.has(input.preset);
  if (input.mode === "ONE_V_ONE" && !isSoloPreset) {
    return { success: false, error: "1v1 requires a Solo preset" };
  }
  if (input.mode === "THREE_V_THREE" && isSoloPreset) {
    return { success: false, error: "3v3 requires a 3v3 preset" };
  }
  if (!input.name.trim()) return { success: false, error: "Name is required" };
  if (!(input.maxParticipants > 0)) {
    return { success: false, error: "Max participants must be a positive number" };
  }
  const startAt = new Date(input.startAt);
  if (Number.isNaN(startAt.getTime())) {
    return { success: false, error: "Enter a valid start date" };
  }

  const tournament = await prisma.tournament.create({
    data: {
      name: input.name.trim(),
      slug: slugify(input.name),
      description: "",
      organizerName: user.name ?? "Organizer",
      startAt,
      mode: input.mode,
      preset: input.preset,
      structureType: input.structureType,
      registrationOpensAt: new Date(),
      registrationClosesAt: startAt,
      maxParticipants: input.maxParticipants,
      ownerId: user.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      tournamentId: tournament.id,
      action: "TOURNAMENT_CREATED",
      entityType: "Tournament",
      entityId: tournament.id,
    },
  });

  revalidatePath("/admin/tournaments");
  return { success: true, id: tournament.id };
}

export async function updateBasicsAction(id: string, input: unknown): Promise<TournamentActionResult> {
  await requireTournamentAdmin(id);
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { coverImageUrl, contactInfo, instructions, ...rest } = parsed.data;
  await prisma.tournament.update({
    where: { id },
    data: {
      ...rest,
      coverImageUrl: coverImageUrl || null,
      contactInfo: contactInfo || null,
      instructions: instructions || null,
    },
  });
  revalidatePath(`/admin/tournaments/${id}/edit`);
  return { success: true };
}

export async function updateRulesAction(id: string, input: unknown): Promise<TournamentActionResult> {
  await requireTournamentAdmin(id);
  const parsed = rulesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { allowedFighterIds, eligibilityNotes, levelRuleDescription, ...rest } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: {
        ...rest,
        eligibilityNotes: eligibilityNotes || null,
        levelRuleDescription: levelRuleDescription || null,
      },
    });
    if (allowedFighterIds !== undefined) {
      await tx.tournamentAllowedFighter.deleteMany({ where: { tournamentId: id } });
      if (allowedFighterIds.length > 0) {
        await tx.tournamentAllowedFighter.createMany({
          data: allowedFighterIds.map((fighterId) => ({ tournamentId: id, fighterId })),
        });
      }
    }
  });

  revalidatePath(`/admin/tournaments/${id}/edit`);
  return { success: true };
}

export async function updateRegistrationSettingsAction(
  id: string,
  input: unknown
): Promise<TournamentActionResult> {
  await requireTournamentAdmin(id);
  const parsed = registrationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.tournament.update({ where: { id }, data: parsed.data });
  revalidatePath(`/admin/tournaments/${id}/edit`);
  return { success: true };
}

export async function updatePaymentConfigAction(
  id: string,
  input: unknown,
  confirmChangeWithExistingRegistrations = false
): Promise<TournamentActionResult> {
  await requireTournamentAdmin(id);
  const parsed = paymentConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { isPaid, entryFeePaise, upiId, payeeName, qrCodeImageUrl, instructions, submissionDeadlineAt, transactionRefRequired, screenshotDiscordUrl, refundPolicy } = parsed.data;

  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id }, select: { isPaid: true } });
  if (tournament.isPaid !== isPaid && !confirmChangeWithExistingRegistrations) {
    const registrationCount = await prisma.tournamentRegistration.count({ where: { tournamentId: id } });
    if (registrationCount > 0) {
      return {
        success: false,
        error: `This tournament already has ${registrationCount} registration(s). Changing between free and paid requires explicit confirmation.`,
      };
    }
  }

  if (isPaid && (!upiId || !payeeName || !qrCodeImageUrl)) {
    return {
      success: false,
      error: "UPI ID, payee name, and QR code image are required for a paid tournament",
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({ where: { id }, data: { isPaid, entryFeePaise: isPaid ? entryFeePaise ?? 0 : 0 } });
    if (isPaid) {
      await tx.tournamentPaymentConfig.upsert({
        where: { tournamentId: id },
        create: {
          tournamentId: id,
          upiId: upiId!,
          payeeName: payeeName!,
          qrCodeImageUrl: qrCodeImageUrl!,
          instructions: instructions || null,
          submissionDeadlineAt,
          transactionRefRequired,
          screenshotDiscordUrl: screenshotDiscordUrl || null,
          refundPolicy: refundPolicy || null,
        },
        update: {
          upiId: upiId!,
          payeeName: payeeName!,
          qrCodeImageUrl: qrCodeImageUrl!,
          instructions: instructions || null,
          submissionDeadlineAt,
          transactionRefRequired,
          screenshotDiscordUrl: screenshotDiscordUrl || null,
          refundPolicy: refundPolicy || null,
        },
      });
    } else {
      await tx.tournamentPaymentConfig.deleteMany({ where: { tournamentId: id } });
    }
  });

  revalidatePath(`/admin/tournaments/${id}/edit`);
  return { success: true };
}

export async function updatePrizePoolAction(id: string, input: unknown): Promise<TournamentActionResult> {
  await requireTournamentAdmin(id);
  const parsed = prizePoolSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { prizePoolEnabled, prizePoolAmountPaise, prizeFundingType, prizeRevenuePercent, distributions } =
    parsed.data;

  if (prizePoolEnabled && distributions && distributions.length > 0) {
    const percentageTotal = distributions
      .filter((d) => d.valueType === "PERCENTAGE")
      .reduce((sum, d) => sum + d.value, 0);
    const hasPercentage = distributions.some((d) => d.valueType === "PERCENTAGE");
    if (hasPercentage && percentageTotal !== 10000) {
      return { success: false, error: "Percentage-based prize distribution must total 100%" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: { prizePoolEnabled, prizePoolAmountPaise, prizeFundingType, prizeRevenuePercent },
    });
    await tx.tournamentPrizeDistribution.deleteMany({ where: { tournamentId: id } });
    if (prizePoolEnabled && distributions && distributions.length > 0) {
      await tx.tournamentPrizeDistribution.createMany({
        data: distributions.map((d) => ({ tournamentId: id, ...d })),
      });
    }
  });

  revalidatePath(`/admin/tournaments/${id}/edit`);
  return { success: true };
}

export async function updateStructureAction(id: string, input: unknown): Promise<TournamentActionResult> {
  await requireTournamentAdmin(id);
  const parsed = structureSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await prisma.tournament.update({ where: { id }, data: parsed.data });
  revalidatePath(`/admin/tournaments/${id}/edit`);
  return { success: true };
}

export async function publishTournamentAction(id: string): Promise<TournamentActionResult> {
  const user = await requireTournamentAdmin(id);
  const tournament = await prisma.tournament.findUniqueOrThrow({
    where: { id },
    include: { paymentConfig: true, prizeDistributions: true },
  });

  if (tournament.status === "CANCELLED") {
    return { success: false, error: "A cancelled tournament cannot be published" };
  }
  if (!tournament.description.trim()) {
    return { success: false, error: "Add a description before publishing" };
  }
  if (tournament.maxParticipants <= 0) {
    return { success: false, error: "Max participants must be a positive number" };
  }
  if (tournament.registrationClosesAt <= tournament.registrationOpensAt) {
    return { success: false, error: "Registration close time must be after the open time" };
  }
  if (tournament.isPaid) {
    const config = tournament.paymentConfig;
    if (!config || !config.upiId || !config.payeeName || !config.qrCodeImageUrl) {
      return { success: false, error: "Complete the payment configuration before publishing" };
    }
  }
  if (tournament.prizePoolEnabled) {
    if (tournament.prizeDistributions.length === 0) {
      return { success: false, error: "Add at least one prize position before publishing" };
    }
    const percentageTotal = tournament.prizeDistributions
      .filter((d) => d.valueType === "PERCENTAGE")
      .reduce((sum, d) => sum + d.value, 0);
    const hasPercentage = tournament.prizeDistributions.some((d) => d.valueType === "PERCENTAGE");
    if (hasPercentage && percentageTotal !== 10000) {
      return { success: false, error: "Percentage-based prize distribution must total 100%" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        tournamentId: id,
        action: "TOURNAMENT_PUBLISHED",
        entityType: "Tournament",
        entityId: id,
      },
    });
  });

  revalidatePath(`/admin/tournaments/${id}/edit`);
  revalidatePath("/tournaments");
  return { success: true };
}

export async function cancelTournamentAction(id: string, reason: string): Promise<TournamentActionResult> {
  const user = await requireTournamentAdmin(id);
  if (!reason.trim()) {
    return { success: false, error: "A cancellation reason is required" };
  }
  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id }, select: { status: true } });
  if (tournament.status === "CANCELLED") {
    return { success: false, error: "This tournament is already cancelled" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournament.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancellationReason: reason.trim() },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        tournamentId: id,
        action: "TOURNAMENT_CANCELLED",
        entityType: "Tournament",
        entityId: id,
        metadata: { reason: reason.trim() },
      },
    });
  });

  revalidatePath(`/admin/tournaments/${id}/edit`);
  revalidatePath("/admin/tournaments");
  revalidatePath("/tournaments");
  return { success: true };
}

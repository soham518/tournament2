"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { canAcceptRegistrations } from "@/lib/tournaments/status";
import { paymentProofSchema } from "@/lib/validations/registration";

export type RegistrationActionResult =
  | { success: true; registrationId: string }
  | { success: false; error: string };

export type SimpleActionResult = { success: true } | { success: false; error: string };

const ACTIVE_REGISTRATION_STATUSES = ["PENDING", "APPROVED", "WAITLISTED"] as const;

export async function registerForTournamentAction(tournamentId: string): Promise<RegistrationActionResult> {
  const user = await requireUser();
  if (user.role !== "PLAYER") {
    return { success: false, error: "Only players can register for tournaments" };
  }

  const profile = await prisma.playerProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return { success: false, error: "Complete your player profile before registering" };
  }

  return prisma.$transaction(async (tx): Promise<RegistrationActionResult> => {
    // Serializes concurrent registrations for this tournament so the
    // capacity check below can't race: without this, two players hitting
    // "register" in the same instant could both pass a stale count check
    // and both get inserted, overrunning maxParticipants.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${tournamentId}))`;

    const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.status !== "PUBLISHED") {
      return { success: false, error: "This tournament is not open for registration" };
    }

    const existing = await tx.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId, playerId: user.id } },
    });
    if (existing && ["PENDING", "APPROVED", "WAITLISTED"].includes(existing.status)) {
      return { success: false, error: "You are already registered for this tournament" };
    }

    // Opportunistically expire stale pending-payment registrations before
    // counting capacity, so an abandoned payment doesn't hold a slot forever.
    await tx.tournamentRegistration.updateMany({
      where: {
        tournamentId,
        status: "PENDING",
        paymentStatus: { in: ["PENDING", "PROOF_SUBMITTED", "PENDING_VERIFICATION"] },
        paymentExpiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const confirmedCount = await tx.tournamentRegistration.count({
      where: { tournamentId, status: "APPROVED" },
    });
    const activeCount = await tx.tournamentRegistration.count({
      where: { tournamentId, status: { in: [...ACTIVE_REGISTRATION_STATUSES] } },
    });

    if (!canAcceptRegistrations(tournament, confirmedCount)) {
      return { success: false, error: "Registration is not currently open for this tournament" };
    }

    const isFull = activeCount >= tournament.maxParticipants;
    const willWaitlist = isFull && tournament.waitlistEnabled;
    if (isFull && !tournament.waitlistEnabled) {
      return { success: false, error: "This tournament is full" };
    }

    const paymentExpiresAt = tournament.isPaid && tournament.paymentDeadlineMinutes
      ? new Date(Date.now() + tournament.paymentDeadlineMinutes * 60_000)
      : null;

    const initialStatus = willWaitlist
      ? "WAITLISTED"
      : tournament.isPaid
        ? "PENDING"
        : tournament.approvalMode === "AUTOMATIC"
          ? "APPROVED"
          : "PENDING";

    const registration = await tx.tournamentRegistration.upsert({
      where: { tournamentId_playerId: { tournamentId, playerId: user.id } },
      create: {
        tournamentId,
        playerId: user.id,
        status: initialStatus,
        paymentStatus: tournament.isPaid ? "PENDING" : "NOT_REQUIRED",
        paymentExpiresAt,
        approvedAt: initialStatus === "APPROVED" ? new Date() : null,
      },
      update: {
        status: initialStatus,
        paymentStatus: tournament.isPaid ? "PENDING" : "NOT_REQUIRED",
        paymentExpiresAt,
        approvedAt: initialStatus === "APPROVED" ? new Date() : null,
        rejectionReason: null,
        withdrawnAt: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        tournamentId,
        action: "REGISTRATION_CREATED",
        entityType: "TournamentRegistration",
        entityId: registration.id,
      },
    });

    return { success: true, registrationId: registration.id };
  }).then((result) => {
    revalidatePath(`/tournaments`);
    return result;
  });
}

export async function submitPaymentProofAction(
  registrationId: string,
  input: unknown
): Promise<SimpleActionResult> {
  const user = await requireUser();
  const parsed = paymentProofSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { tournament: true },
  });
  if (!registration || registration.playerId !== user.id) {
    return { success: false, error: "Registration not found" };
  }
  if (!registration.tournament.isPaid) {
    return { success: false, error: "This tournament does not require payment" };
  }
  if (registration.status === "EXPIRED" || registration.status === "CANCELLED") {
    return { success: false, error: "This registration is no longer active" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { registrationId },
      create: {
        registrationId,
        amountPaise: registration.tournament.entryFeePaise ?? 0,
        transactionRef: parsed.data.transactionRef,
        status: "PENDING_VERIFICATION",
      },
      update: {
        transactionRef: parsed.data.transactionRef,
        status: "PENDING_VERIFICATION",
        rejectionReason: null,
        submittedAt: new Date(),
      },
    });
    await tx.tournamentRegistration.update({
      where: { id: registrationId },
      data: { paymentStatus: "PENDING_VERIFICATION" },
    });
  });

  revalidatePath(`/dashboard/registrations/${registrationId}`);
  return { success: true };
}

export async function withdrawRegistrationAction(registrationId: string): Promise<SimpleActionResult> {
  const user = await requireUser();
  const registration = await prisma.tournamentRegistration.findUnique({
    where: { id: registrationId },
    include: { tournament: true },
  });
  if (!registration || registration.playerId !== user.id) {
    return { success: false, error: "Registration not found" };
  }
  if (new Date() >= registration.tournament.startAt) {
    return { success: false, error: "Cannot withdraw after the tournament has started" };
  }

  await prisma.tournamentRegistration.update({
    where: { id: registrationId },
    data: { status: "WITHDRAWN", withdrawnAt: new Date() },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

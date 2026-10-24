"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import type { SimpleActionResult } from "@/lib/actions/registration";

export async function approvePaymentAction(paymentId: string): Promise<SimpleActionResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { registration: { include: { tournament: true } } },
  });
  if (!payment) return { success: false, error: "Payment not found" };

  const user = await requireTournamentAdmin(payment.registration.tournamentId);
  const tournament = payment.registration.tournament;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "VERIFIED", reviewedById: user.id, reviewedAt: new Date() },
    });

    const shouldAutoApprove =
      tournament.approvalMode === "AUTOMATIC" && payment.registration.status === "PENDING";

    await tx.tournamentRegistration.update({
      where: { id: payment.registrationId },
      data: {
        paymentStatus: "VERIFIED",
        ...(shouldAutoApprove ? { status: "APPROVED", approvedAt: new Date() } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        tournamentId: tournament.id,
        action: "PAYMENT_VERIFIED",
        entityType: "Payment",
        entityId: paymentId,
      },
    });
  });

  revalidatePath(`/admin/tournaments/${tournament.id}/payments`);
  return { success: true };
}

export async function rejectPaymentAction(paymentId: string, reason: string): Promise<SimpleActionResult> {
  if (!reason.trim()) return { success: false, error: "A rejection reason is required" };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { registration: { include: { tournament: true } } },
  });
  if (!payment) return { success: false, error: "Payment not found" };

  const user = await requireTournamentAdmin(payment.registration.tournamentId);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "REJECTED",
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: reason.trim(),
      },
    });
    await tx.tournamentRegistration.update({
      where: { id: payment.registrationId },
      data: { paymentStatus: "REJECTED" },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        tournamentId: payment.registration.tournamentId,
        action: "PAYMENT_REJECTED",
        entityType: "Payment",
        entityId: paymentId,
        metadata: { reason: reason.trim() },
      },
    });
  });

  revalidatePath(`/admin/tournaments/${payment.registration.tournamentId}/payments`);
  return { success: true };
}

export async function flagPaymentAction(paymentId: string, reason: string): Promise<SimpleActionResult> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { registration: { select: { tournamentId: true } } },
  });
  if (!payment) return { success: false, error: "Payment not found" };
  await requireTournamentAdmin(payment.registration.tournamentId);

  await prisma.payment.update({
    where: { id: paymentId },
    data: { isFlagged: true, flagReason: reason.trim() || "Flagged for review" },
  });

  revalidatePath(`/admin/tournaments/${payment.registration.tournamentId}/payments`);
  return { success: true };
}

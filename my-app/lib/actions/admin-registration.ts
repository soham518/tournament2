"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import type { SimpleActionResult } from "@/lib/actions/registration";

export async function approveRegistrationAction(registrationId: string): Promise<SimpleActionResult> {
  const registration = await prisma.tournamentRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return { success: false, error: "Registration not found" };
  const admin = await requireTournamentAdmin(registration.tournamentId);

  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id: registration.tournamentId } });
  if (tournament.isPaid && registration.paymentStatus !== "VERIFIED") {
    return { success: false, error: "Payment must be verified before approving this registration" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: { id: registrationId },
      data: { status: "APPROVED", approvedAt: new Date(), approvedById: admin.id, rejectionReason: null },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        tournamentId: registration.tournamentId,
        action: "REGISTRATION_APPROVED",
        entityType: "TournamentRegistration",
        entityId: registrationId,
      },
    });
  });

  revalidatePath(`/admin/tournaments/${registration.tournamentId}/registrations`);
  return { success: true };
}

export async function rejectRegistrationAction(
  registrationId: string,
  reason: string
): Promise<SimpleActionResult> {
  if (!reason.trim()) return { success: false, error: "A rejection reason is required" };
  const registration = await prisma.tournamentRegistration.findUnique({ where: { id: registrationId } });
  if (!registration) return { success: false, error: "Registration not found" };
  const admin = await requireTournamentAdmin(registration.tournamentId);

  await prisma.$transaction(async (tx) => {
    await tx.tournamentRegistration.update({
      where: { id: registrationId },
      data: { status: "REJECTED", rejectionReason: reason.trim() },
    });
    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        tournamentId: registration.tournamentId,
        action: "REGISTRATION_REJECTED",
        entityType: "TournamentRegistration",
        entityId: registrationId,
        metadata: { reason: reason.trim() },
      },
    });
  });

  revalidatePath(`/admin/tournaments/${registration.tournamentId}/registrations`);
  return { success: true };
}

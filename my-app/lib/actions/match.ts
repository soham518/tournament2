"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTournamentAdmin, requireUser } from "@/lib/auth/guards";

export type MatchActionResult = { success: true } | { success: false; error: string };

type Outcome = "A_WIN" | "B_WIN" | "FORFEIT_A" | "FORFEIT_B";

function winnerSlot(outcome: Outcome): "A" | "B" {
  return outcome === "A_WIN" || outcome === "FORFEIT_B" ? "A" : "B";
}

export async function recordOfficialResultAction(
  matchId: string,
  input: { outcome: Outcome; scoreA?: number; scoreB?: number; note?: string }
): Promise<MatchActionResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });
  if (!match) return { success: false, error: "Match not found" };

  const admin = await requireTournamentAdmin(match.tournamentId);

  const winningParticipant = match.participants.find((p) => p.slot === winnerSlot(input.outcome));
  if (!winningParticipant) {
    return { success: false, error: "Both participants must be set before recording a result" };
  }

  await prisma.$transaction(async (tx) => {
    const result = await tx.matchResult.create({
      data: {
        matchId,
        reportedById: admin.id,
        scoreA: input.scoreA,
        scoreB: input.scoreB,
        outcome: input.outcome,
        isOfficial: true,
        finalizedById: admin.id,
        finalizedAt: new Date(),
        note: input.note,
      },
    });

    await tx.match.update({
      where: { id: matchId },
      data: {
        status: input.outcome.startsWith("FORFEIT") ? "FORFEITED" : "COMPLETED",
        winnerRegistrationId: winningParticipant.registrationId,
      },
    });

    if (match.advancesToMatchId && match.advancesToSlot) {
      await tx.matchParticipant.upsert({
        where: { matchId_slot: { matchId: match.advancesToMatchId, slot: match.advancesToSlot } },
        create: {
          matchId: match.advancesToMatchId,
          slot: match.advancesToSlot,
          registrationId: winningParticipant.registrationId,
        },
        update: { registrationId: winningParticipant.registrationId },
      });

      const nextMatch = await tx.match.findUnique({
        where: { id: match.advancesToMatchId },
        include: { participants: true },
      });
      if (nextMatch && nextMatch.participants.length === 2 && nextMatch.status === "PENDING") {
        await tx.match.update({ where: { id: nextMatch.id }, data: { status: "SCHEDULED" } });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: admin.id,
        tournamentId: match.tournamentId,
        action: "MATCH_RESULT_FINALIZED",
        entityType: "Match",
        entityId: matchId,
        metadata: { outcome: input.outcome },
      },
    });

    return result;
  });

  revalidatePath(`/admin/tournaments/${match.tournamentId}/bracket`);
  revalidatePath(`/tournaments`);
  return { success: true };
}

export async function scheduleMatchAction(matchId: string, scheduledAt: string): Promise<MatchActionResult> {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { success: false, error: "Match not found" };
  await requireTournamentAdmin(match.tournamentId);

  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return { success: false, error: "Enter a valid date" };

  await prisma.match.update({ where: { id: matchId }, data: { scheduledAt: date } });
  revalidatePath(`/admin/tournaments/${match.tournamentId}/bracket`);
  return { success: true };
}

export async function openDisputeAction(matchId: string, reason: string): Promise<MatchActionResult> {
  const user = await requireUser();
  if (!reason.trim()) return { success: false, error: "A reason is required" };

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { participants: true },
  });
  if (!match) return { success: false, error: "Match not found" };

  if (user.role === "PLAYER") {
    const ownRegistration = await prisma.tournamentRegistration.findUnique({
      where: { tournamentId_playerId: { tournamentId: match.tournamentId, playerId: user.id } },
      select: { id: true },
    });
    const isParticipant = match.participants.some((p) => p.registrationId === ownRegistration?.id);
    if (!isParticipant) {
      return { success: false, error: "Only match participants can open a dispute" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.dispute.create({
      data: {
        matchId,
        tournamentId: match.tournamentId,
        openedById: user.id,
        reason: reason.trim(),
      },
    });
    await tx.match.update({ where: { id: matchId }, data: { status: "UNDER_DISPUTE" } });
  });

  revalidatePath(`/admin/tournaments/${match.tournamentId}/disputes`);
  return { success: true };
}

export async function resolveDisputeAction(disputeId: string, resolution: string): Promise<MatchActionResult> {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId }, include: { match: true } });
  if (!dispute) return { success: false, error: "Dispute not found" };
  if (!resolution.trim()) return { success: false, error: "A resolution note is required" };

  const admin = await requireTournamentAdmin(dispute.tournamentId);

  await prisma.$transaction(async (tx) => {
    await tx.dispute.update({
      where: { id: disputeId },
      data: { status: "RESOLVED", resolution: resolution.trim(), resolvedById: admin.id, resolvedAt: new Date() },
    });
    if (dispute.match.status === "UNDER_DISPUTE") {
      await tx.match.update({ where: { id: dispute.matchId }, data: { status: "SCHEDULED" } });
    }
  });

  revalidatePath(`/admin/tournaments/${dispute.tournamentId}/disputes`);
  return { success: true };
}

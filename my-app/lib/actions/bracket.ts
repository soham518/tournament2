"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { generateKnockoutBracket, generateRoundRobinPairs } from "@/lib/tournaments/bracket";

export type BracketActionResult = { success: true } | { success: false; error: string };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function generateKnockoutStageAction(tournamentId: string): Promise<BracketActionResult> {
  const actor = await requireTournamentAdmin(tournamentId);

  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
  if (tournament.structureType !== "KNOCKOUT") {
    return { success: false, error: "This tournament isn't configured as a knockout" };
  }

  const existingStage = await prisma.tournamentStage.findFirst({ where: { tournamentId } });
  if (existingStage) {
    return { success: false, error: "A bracket has already been generated for this tournament" };
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, status: "APPROVED" },
    orderBy: { seed: "asc" },
  });
  if (registrations.length < 2) {
    return { success: false, error: "At least 2 approved participants are required" };
  }

  const orderedIds =
    tournament.seedingMethod === "MANUAL" && registrations.every((r) => r.seed !== null)
      ? registrations.map((r) => r.id)
      : shuffle(registrations.map((r) => r.id));

  const bracketMatches = generateKnockoutBracket(orderedIds, tournament.hasThirdPlaceMatch);

  await prisma.$transaction(async (tx) => {
    const stage = await tx.tournamentStage.create({
      data: { tournamentId, type: "KNOCKOUT", order: 1, name: "Knockout" },
    });

    // matchNumber must be globally unique per (tournament, round) across all
    // stages, so round/matchNumber pairs from the pure generator are used as-is.
    const createdByRoundAndNumber = new Map<string, string>();
    for (const bm of bracketMatches) {
      const match = await tx.match.create({
        data: {
          tournamentId,
          stageId: stage.id,
          round: bm.round,
          matchNumber: bm.matchNumber,
          isThirdPlace: bm.isThirdPlace,
          status: bm.participantAId && bm.participantBId ? "SCHEDULED" : "PENDING",
        },
      });
      createdByRoundAndNumber.set(`${bm.round}:${bm.matchNumber}`, match.id);

      if (bm.participantAId) {
        await tx.matchParticipant.create({
          data: { matchId: match.id, registrationId: bm.participantAId, slot: "A" },
        });
      }
      if (bm.participantBId) {
        await tx.matchParticipant.create({
          data: { matchId: match.id, registrationId: bm.participantBId, slot: "B" },
        });
      }

      // A bye resolves immediately: the lone participant is the winner with
      // no match played, and advances to the next round right away.
      const byeWinner = !bm.participantAId ? bm.participantBId : !bm.participantBId ? bm.participantAId : null;
      if (byeWinner && bm.participantAId !== bm.participantBId) {
        await tx.match.update({
          where: { id: match.id },
          data: { status: "COMPLETED", winnerRegistrationId: byeWinner },
        });
      }
    }

    // Wire up advancesToMatchId now that every match in this stage has an id,
    // and propagate any bye winners into the next round's slots.
    for (const bm of bracketMatches) {
      if (bm.advancesToMatchNumber === null) continue;
      const matchId = createdByRoundAndNumber.get(`${bm.round}:${bm.matchNumber}`)!;
      const nextMatchId = createdByRoundAndNumber.get(`${bm.round + 1}:${bm.advancesToMatchNumber}`);
      if (!nextMatchId) continue;
      await tx.match.update({
        where: { id: matchId },
        data: { advancesToMatchId: nextMatchId, advancesToSlot: bm.advancesToSlot },
      });

      const byeWinner = !bm.participantAId ? bm.participantBId : !bm.participantBId ? bm.participantAId : null;
      if (byeWinner) {
        await tx.matchParticipant.create({
          data: { matchId: nextMatchId, registrationId: byeWinner, slot: bm.advancesToSlot! },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        tournamentId,
        action: "BRACKET_GENERATED",
        entityType: "TournamentStage",
        entityId: stage.id,
      },
    });
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/bracket`);
  revalidatePath(`/tournaments`);
  return { success: true };
}

export async function generateGroupStageAction(
  tournamentId: string,
  groupSize: number
): Promise<BracketActionResult> {
  const actor = await requireTournamentAdmin(tournamentId);

  const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } });
  if (tournament.structureType !== "GROUP" && tournament.structureType !== "GROUP_THEN_KNOCKOUT") {
    return { success: false, error: "This tournament isn't configured with a group stage" };
  }
  const existingStage = await prisma.tournamentStage.findFirst({ where: { tournamentId } });
  if (existingStage) {
    return { success: false, error: "A group stage has already been generated" };
  }
  if (!(groupSize >= 2)) {
    return { success: false, error: "Group size must be at least 2" };
  }

  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId, status: "APPROVED" },
  });
  if (registrations.length < groupSize) {
    return { success: false, error: "Not enough approved participants for a single group" };
  }

  const shuffled = shuffle(registrations);
  const groups: typeof shuffled[] = [];
  for (let i = 0; i < shuffled.length; i += groupSize) {
    groups.push(shuffled.slice(i, i + groupSize));
  }

  await prisma.$transaction(async (tx) => {
    const stage = await tx.tournamentStage.create({
      data: { tournamentId, type: "GROUP", order: 1, name: "Group Stage" },
    });

    let matchNumber = 1;
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = await tx.tournamentGroup.create({
        data: { stageId: stage.id, name: `Group ${String.fromCharCode(65 + groupIndex)}` },
      });
      await tx.groupMembership.createMany({
        data: group ? groups[groupIndex].map((r) => ({ groupId: group.id, registrationId: r.id })) : [],
      });

      const pairs = generateRoundRobinPairs(groups[groupIndex]);
      for (const [a, b] of pairs) {
        const match = await tx.match.create({
          data: {
            tournamentId,
            stageId: stage.id,
            groupId: group.id,
            round: 1,
            matchNumber: matchNumber++,
            status: "SCHEDULED",
          },
        });
        await tx.matchParticipant.createMany({
          data: [
            { matchId: match.id, registrationId: a.id, slot: "A" },
            { matchId: match.id, registrationId: b.id, slot: "B" },
          ],
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        tournamentId,
        action: "GROUP_STAGE_GENERATED",
        entityType: "TournamentStage",
        entityId: stage.id,
      },
    });
  });

  revalidatePath(`/admin/tournaments/${tournamentId}/bracket`);
  return { success: true };
}

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/guards";
import { completeProfileSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function completeProfileAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = completeProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { sfaInGameName, sfaPlayerId, discordId, platform, bio } = parsed.data;

  if (platform) {
    const duplicate = await prisma.playerProfile.findUnique({
      where: { platform_sfaPlayerId: { platform, sfaPlayerId } },
      select: { userId: true },
    });
    if (duplicate && duplicate.userId !== user.id) {
      return {
        success: false,
        error: "This Shadow Fight Arena player ID is already linked to another account",
      };
    }
  }

  await prisma.playerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, sfaInGameName, sfaPlayerId, discordId, platform, bio },
    update: { sfaInGameName, sfaPlayerId, discordId, platform, bio },
  });

  redirect("/dashboard");
}

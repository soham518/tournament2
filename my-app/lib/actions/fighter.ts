"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/guards";
import { fighterSchema } from "@/lib/validations/fighter";

export type FighterActionResult = { success: true } | { success: false; error: string };

function normalizeOptional(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function createFighterAction(input: unknown): Promise<FighterActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = fighterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, rarity, isAvailable, description, portraitImageUrl } = parsed.data;

  const existing = await prisma.fighter.findUnique({ where: { name } });
  if (existing) {
    return { success: false, error: "A fighter with this name already exists" };
  }

  await prisma.fighter.create({
    data: {
      name,
      rarity,
      isAvailable,
      description: normalizeOptional(description),
      portraitImageUrl: normalizeOptional(portraitImageUrl),
    },
  });

  revalidatePath("/admin/fighters");
  return { success: true };
}

export async function updateFighterAction(id: string, input: unknown): Promise<FighterActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = fighterSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, rarity, isAvailable, description, portraitImageUrl } = parsed.data;

  const duplicate = await prisma.fighter.findFirst({ where: { name, NOT: { id } } });
  if (duplicate) {
    return { success: false, error: "A fighter with this name already exists" };
  }

  await prisma.fighter.update({
    where: { id },
    data: {
      name,
      rarity,
      isAvailable,
      description: normalizeOptional(description),
      portraitImageUrl: normalizeOptional(portraitImageUrl),
    },
  });

  revalidatePath("/admin/fighters");
  return { success: true };
}

export async function setFighterAvailabilityAction(id: string, isAvailable: boolean) {
  await requireRole(["SUPER_ADMIN"]);
  await prisma.fighter.update({ where: { id }, data: { isAvailable } });
  revalidatePath("/admin/fighters");
}

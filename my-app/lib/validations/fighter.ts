import { z } from "zod";

export const fighterRaritySchema = z.enum(["COMMON", "RARE", "EPIC", "LEGENDARY"]);

export const fighterSchema = z.object({
  name: z.string().trim().min(2, "Required").max(40),
  rarity: fighterRaritySchema,
  isAvailable: z.boolean(),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  portraitImageUrl: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

export type FighterInput = z.infer<typeof fighterSchema>;

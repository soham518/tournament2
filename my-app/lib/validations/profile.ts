import { z } from "zod";

export const completeProfileSchema = z.object({
  sfaInGameName: z.string().trim().min(2, "Required").max(40),
  sfaPlayerId: z.string().trim().min(2, "Required").max(40),
  discordId: z.string().trim().min(2, "Required").max(40),
  platform: z.enum(["MOBILE", "PC", "OTHER"]).optional(),
  bio: z.string().trim().max(280).optional(),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

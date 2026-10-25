import { z } from "zod";

export const completeProfileSchema = z.object({
  sfaInGameName: z.string().trim().min(2, "Required").max(40),
  sfaPlayerId: z.string().trim().min(2, "Required").max(40),
  discordId: z.string().trim().min(2, "Required").max(40),
  // A native <select> submits "" for an unselected placeholder option
  // (unlike the old Controller-driven Select, which left the field
  // genuinely undefined) — treat "" as "not provided" too.
  platform: z
    .union([z.enum(["MOBILE", "PC", "OTHER"]), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  bio: z.string().trim().max(280).optional(),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
// Pre-transform shape (platform may still be ""), used for the form's own
// state/typing — the schema's transform only matters at submit/validation time.
export type CompleteProfileFormValues = z.input<typeof completeProfileSchema>;

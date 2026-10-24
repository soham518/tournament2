import { z } from "zod";

export const competitionModeSchema = z.enum(["ONE_V_ONE", "THREE_V_THREE"]);
export const tournamentPresetSchema = z.enum([
  "SOLO_FIXED",
  "SOLO_FLEXIBLE",
  "THREE_V_THREE_FIXED",
  "THREE_V_THREE_FLEXIBLE",
]);
export const structureTypeSchema = z.enum(["KNOCKOUT", "GROUP", "GROUP_THEN_KNOCKOUT"]);
export const seedingMethodSchema = z.enum(["MANUAL", "RANDOM"]);
export const approvalModeSchema = z.enum(["AUTOMATIC", "MANUAL"]);
export const prizeFundingTypeSchema = z.enum(["GUARANTEED", "REGISTRATION_DEPENDENT"]);

// A preset must correspond to the selected mode — SOLO_* only valid for
// ONE_V_ONE, THREE_V_THREE_* only valid for THREE_V_THREE. Enforced in
// basicsSchema's superRefine rather than relying on the client to only
// ever offer the compatible pairing.
export const basicsSchema = z
  .object({
    name: z.string().trim().min(3).max(80),
    description: z.string().trim().min(1).max(4000),
    coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
    organizerName: z.string().trim().min(1).max(80),
    startAt: z.coerce.date(),
    endAt: z.coerce.date().optional(),
    timezone: z.string().min(1).default("Asia/Kolkata"),
    contactInfo: z.string().trim().max(300).optional().or(z.literal("")),
    instructions: z.string().trim().max(4000).optional().or(z.literal("")),
    mode: competitionModeSchema,
    preset: tournamentPresetSchema,
  })
  .superRefine((data, ctx) => {
    const soloPresets = new Set(["SOLO_FIXED", "SOLO_FLEXIBLE"]);
    const isSoloPreset = soloPresets.has(data.preset);
    if (data.mode === "ONE_V_ONE" && !isSoloPreset) {
      ctx.addIssue({ code: "custom", path: ["preset"], message: "1v1 requires a Solo preset" });
    }
    if (data.mode === "THREE_V_THREE" && isSoloPreset) {
      ctx.addIssue({ code: "custom", path: ["preset"], message: "3v3 requires a 3v3 preset" });
    }
    if (data.endAt && data.endAt <= data.startAt) {
      ctx.addIssue({ code: "custom", path: ["endAt"], message: "End must be after start" });
    }
  });

export const rulesSchema = z.object({
  legendaryFightersAllowed: z.boolean(),
  minAccountLevel: z.coerce.number().int().positive().optional(),
  eligibilityNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  levelRuleEnabled: z.boolean(),
  levelRuleDescription: z.string().trim().max(2000).optional().or(z.literal("")),
  levelRuleRequiresVerification: z.boolean(),
  rosterMinLevel: z.coerce.number().int().positive().optional(),
  rosterLevelAppliesToAllFighters: z.boolean(),
  allowedFighterIds: z.array(z.string()).optional(),
});

export const registrationSettingsSchema = z
  .object({
    registrationOpensAt: z.coerce.date(),
    registrationClosesAt: z.coerce.date(),
    maxParticipants: z.coerce.number().int().positive(),
    minParticipants: z.coerce.number().int().positive().optional(),
    waitlistEnabled: z.boolean(),
    approvalMode: approvalModeSchema,
    paymentDeadlineMinutes: z.coerce.number().int().positive().optional(),
    checkInEnabled: z.boolean(),
    checkInOpensBeforeMinutes: z.coerce.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.registrationClosesAt <= data.registrationOpensAt) {
      ctx.addIssue({
        code: "custom",
        path: ["registrationClosesAt"],
        message: "Registration must close after it opens",
      });
    }
  });

export const paymentConfigSchema = z.object({
  isPaid: z.boolean(),
  entryFeePaise: z.coerce.number().int().nonnegative().optional(),
  upiId: z.string().trim().min(1).optional().or(z.literal("")),
  payeeName: z.string().trim().min(1).optional().or(z.literal("")),
  qrCodeImageUrl: z.string().trim().url().optional().or(z.literal("")),
  instructions: z.string().trim().max(2000).optional().or(z.literal("")),
  submissionDeadlineAt: z.coerce.date().optional(),
  transactionRefRequired: z.boolean(),
  screenshotDiscordUrl: z.string().trim().url().optional().or(z.literal("")),
  refundPolicy: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const prizeDistributionEntrySchema = z.object({
  position: z.coerce.number().int().positive(),
  label: z.string().trim().min(1).max(40),
  valueType: z.enum(["FIXED", "PERCENTAGE"]),
  value: z.coerce.number().int().nonnegative(),
});

export const prizePoolSchema = z.object({
  prizePoolEnabled: z.boolean(),
  prizePoolAmountPaise: z.coerce.number().int().nonnegative().optional(),
  prizeFundingType: prizeFundingTypeSchema.optional(),
  prizeRevenuePercent: z.coerce.number().int().min(0).max(100).optional(),
  distributions: z.array(prizeDistributionEntrySchema).optional(),
});

export const structureSchema = z.object({
  structureType: structureTypeSchema,
  seedingMethod: seedingMethodSchema,
  hasThirdPlaceMatch: z.boolean(),
  groupSize: z.coerce.number().int().min(2).optional(),
  advancesPerGroup: z.coerce.number().int().min(1).optional(),
});

export type BasicsInput = z.infer<typeof basicsSchema>;
export type RulesInput = z.infer<typeof rulesSchema>;
export type RegistrationSettingsInput = z.infer<typeof registrationSettingsSchema>;
export type PaymentConfigInput = z.infer<typeof paymentConfigSchema>;
export type PrizePoolInput = z.infer<typeof prizePoolSchema>;
export type StructureInput = z.infer<typeof structureSchema>;

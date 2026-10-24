import { z } from "zod";

export const paymentProofSchema = z.object({
  transactionRef: z.string().trim().min(3, "Enter the transaction reference / UTR").max(100),
});

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { submitPaymentProofAction } from "@/lib/actions/registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PaymentProofForm({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ transactionRef: string }>();

  async function onSubmit(values: { transactionRef: string }) {
    setServerError(null);
    const result = await submitPaymentProofAction(registrationId, values);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Label htmlFor="transactionRef">Transaction reference / UTR</Label>
      <Input id="transactionRef" {...register("transactionRef", { required: true })} />
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit payment proof"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { submitPaymentProofAction } from "@/lib/actions/registration";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswFieldError } from "@/components/usw/field-error";

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
      <UswLabel htmlFor="transactionRef">Transaction reference / UTR</UswLabel>
      <UswInput id="transactionRef" {...register("transactionRef", { required: true })} />
      <UswFieldError>{serverError}</UswFieldError>
      <UswButton type="submit" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit payment proof"}
      </UswButton>
    </form>
  );
}

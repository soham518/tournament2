"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawRegistrationAction } from "@/lib/actions/registration";
import { UswButton } from "@/components/usw/button";
import { UswFieldError } from "@/components/usw/field-error";

export function WithdrawButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleWithdraw() {
    setIsPending(true);
    const result = await withdrawRegistrationAction(registrationId);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (!confirming) {
    return (
      <UswButton variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Withdraw
      </UswButton>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
        Withdraw from this tournament?
      </p>
      <div className="flex gap-2">
        <UswButton variant="destructive" size="sm" onClick={handleWithdraw} disabled={isPending}>
          Confirm withdraw
        </UswButton>
        <UswButton variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </UswButton>
      </div>
      <UswFieldError>{error}</UswFieldError>
    </div>
  );
}

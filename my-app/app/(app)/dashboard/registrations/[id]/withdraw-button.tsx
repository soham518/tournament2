"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawRegistrationAction } from "@/lib/actions/registration";
import { Button } from "@/components/ui/button";

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
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Withdraw
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">Withdraw from this tournament?</p>
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={handleWithdraw} disabled={isPending}>
          Confirm withdraw
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

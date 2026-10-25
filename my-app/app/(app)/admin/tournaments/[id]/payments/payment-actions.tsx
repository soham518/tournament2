"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentAction, rejectPaymentAction, flagPaymentAction } from "@/lib/actions/payment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function approve() {
    setIsPending(true);
    const result = await approvePaymentAction(paymentId);
    setIsPending(false);
    if (!result.success) setError(result.error);
    else router.refresh();
  }

  async function reject() {
    setIsPending(true);
    const result = await rejectPaymentAction(paymentId, reason);
    setIsPending(false);
    if (!result.success) setError(result.error);
    else {
      setShowReject(false);
      router.refresh();
    }
  }

  async function flag() {
    setIsPending(true);
    await flagPaymentAction(paymentId, "Flagged by admin for manual review");
    setIsPending(false);
    router.refresh();
  }

  if (showReject) {
    return (
      <div className="space-y-2">
        <Textarea
          placeholder="Reason for rejection (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={reject} disabled={isPending}>
            Confirm reject
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={approve} disabled={isPending}>
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setShowReject(true)}>
        Reject
      </Button>
      <Button size="sm" variant="outline" onClick={flag} disabled={isPending}>
        Flag
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

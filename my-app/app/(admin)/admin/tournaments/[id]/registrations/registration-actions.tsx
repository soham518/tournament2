"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveRegistrationAction, rejectRegistrationAction } from "@/lib/actions/admin-registration";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RegistrationActions({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function approve() {
    setIsPending(true);
    const result = await approveRegistrationAction(registrationId);
    setIsPending(false);
    if (!result.success) setError(result.error);
    else router.refresh();
  }

  async function reject() {
    setIsPending(true);
    const result = await rejectRegistrationAction(registrationId, reason);
    setIsPending(false);
    if (!result.success) setError(result.error);
    else {
      setShowReject(false);
      router.refresh();
    }
  }

  if (showReject) {
    return (
      <div className="space-y-2">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={reject} disabled={isPending}>
            Confirm
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
    <div className="flex gap-2">
      <Button size="sm" onClick={approve} disabled={isPending}>
        Approve
      </Button>
      <Button size="sm" variant="destructive" onClick={() => setShowReject(true)}>
        Reject
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

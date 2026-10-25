"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveRegistrationAction, rejectRegistrationAction } from "@/lib/actions/admin-registration";
import { UswButton } from "@/components/usw/button";
import { UswTextarea } from "@/components/usw/textarea";
import { UswFieldError } from "@/components/usw/field-error";

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
        <UswTextarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        <div className="flex gap-2">
          <UswButton size="sm" variant="destructive" onClick={reject} disabled={isPending}>
            Confirm
          </UswButton>
          <UswButton size="sm" variant="ghost" onClick={() => setShowReject(false)}>
            Cancel
          </UswButton>
        </div>
        <UswFieldError>{error}</UswFieldError>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <UswButton size="sm" onClick={approve} disabled={isPending}>
        Approve
      </UswButton>
      <UswButton size="sm" variant="destructive" onClick={() => setShowReject(true)}>
        Reject
      </UswButton>
      <UswFieldError>{error}</UswFieldError>
    </div>
  );
}

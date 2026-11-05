"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishTournamentAction, cancelTournamentAction, completeTournamentAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswBadge } from "@/components/usw/badge";
import { UswTextarea } from "@/components/usw/textarea";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import { DISPLAY_STATUS_LABEL, type DisplayStatus } from "@/lib/tournaments/status";

export function PublishTab({
  tournamentId,
  slug,
  status,
  displayStatus,
  approvedRegistrations,
  suggestedWinnerRegistrationId,
}: {
  tournamentId: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED";
  displayStatus: DisplayStatus;
  approvedRegistrations: Array<{ id: string; name: string }>;
  suggestedWinnerRegistrationId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [winnerRegistrationId, setWinnerRegistrationId] = useState(
    suggestedWinnerRegistrationId ?? approvedRegistrations[0]?.id ?? ""
  );
  const [isPending, setIsPending] = useState(false);

  async function handlePublish() {
    setError(null);
    setIsPending(true);
    const result = await publishTournamentAction(tournamentId);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleCancel() {
    setError(null);
    setIsPending(true);
    const result = await cancelTournamentAction(tournamentId, cancelReason);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setShowCancel(false);
    router.refresh();
  }

  async function handleComplete() {
    setError(null);
    if (!winnerRegistrationId) {
      setError("Select a winner");
      return;
    }
    setIsPending(true);
    const result = await completeTournamentAction(tournamentId, winnerRegistrationId);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setShowComplete(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          Current status:
        </span>
        <UswBadge variant="secondary">{DISPLAY_STATUS_LABEL[displayStatus]}</UswBadge>
      </div>

      <div className="flex gap-2">
        <UswButton variant="outline" href={`/tournaments/${slug}`} target="_blank">
          Preview public page
        </UswButton>
        {status === "DRAFT" && (
          <UswButton onClick={handlePublish} disabled={isPending}>
            {isPending ? "Publishing…" : "Publish"}
          </UswButton>
        )}
        {status === "PUBLISHED" && !showCancel && (
          <UswButton variant="destructive" onClick={() => setShowCancel(true)}>
            Cancel tournament
          </UswButton>
        )}
        {status === "PUBLISHED" && !showComplete && (
          <UswButton onClick={() => setShowComplete(true)} disabled={approvedRegistrations.length === 0}>
            Announce winner &amp; complete
          </UswButton>
        )}
      </div>

      {showComplete && (
        <div className="space-y-2 bg-[var(--usw-surface-container-low)] p-3">
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            Select the champion. This marks the tournament Completed and can&apos;t be undone from
            here.
          </p>
          <UswSelect value={winnerRegistrationId} onChange={(e) => setWinnerRegistrationId(e.target.value)}>
            {approvedRegistrations.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </UswSelect>
          <div className="flex gap-2">
            <UswButton size="sm" onClick={handleComplete} disabled={isPending}>
              {isPending ? "Saving…" : "Confirm winner"}
            </UswButton>
            <UswButton variant="ghost" size="sm" onClick={() => setShowComplete(false)}>
              Back
            </UswButton>
          </div>
        </div>
      )}

      {status === "COMPLETED" && (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          This tournament is complete. The champion is shown on its public page.
        </p>
      )}

      {showCancel && (
        <div className="space-y-2 bg-[var(--usw-surface-container-low)] p-3">
          <UswTextarea
            placeholder="Reason for cancellation (required, shown to affected players)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex gap-2">
            <UswButton variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
              Confirm cancellation
            </UswButton>
            <UswButton variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
              Back
            </UswButton>
          </div>
        </div>
      )}

      <UswFieldError>{error}</UswFieldError>
    </div>
  );
}

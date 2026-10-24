"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { publishTournamentAction, cancelTournamentAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DISPLAY_STATUS_LABEL, type DisplayStatus } from "@/lib/tournaments/status";

export function PublishTab({
  tournamentId,
  slug,
  status,
  displayStatus,
}: {
  tournamentId: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  displayStatus: DisplayStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancel, setShowCancel] = useState(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Current status:</span>
        <Badge variant="secondary">{DISPLAY_STATUS_LABEL[displayStatus]}</Badge>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" render={<Link href={`/tournaments/${slug}`} target="_blank">Preview public page</Link>} />
        {status === "DRAFT" && (
          <Button onClick={handlePublish} disabled={isPending}>
            {isPending ? "Publishing…" : "Publish"}
          </Button>
        )}
        {status === "PUBLISHED" && !showCancel && (
          <Button variant="destructive" onClick={() => setShowCancel(true)}>
            Cancel tournament
          </Button>
        )}
      </div>

      {showCancel && (
        <div className="space-y-2 rounded-md border p-3">
          <Textarea
            placeholder="Reason for cancellation (required, shown to affected players)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
              Confirm cancellation
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCancel(false)}>
              Back
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

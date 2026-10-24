"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDisputeAction } from "@/lib/actions/match";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    setIsPending(true);
    const result = await resolveDisputeAction(disputeId, resolution);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Resolution notes"
        value={resolution}
        onChange={(e) => setResolution(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button size="sm" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Resolving…" : "Resolve"}
      </Button>
    </div>
  );
}

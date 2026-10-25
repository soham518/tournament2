"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateKnockoutStageAction, generateGroupStageAction } from "@/lib/actions/bracket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GenerateBracketButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    const result = await generateKnockoutStageAction(tournamentId);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Generating…" : "Generate bracket"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function GenerateGroupStageButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [groupSize, setGroupSize] = useState("4");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    const result = await generateGroupStageAction(tournamentId, Number(groupSize));
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-end gap-2">
      <div className="space-y-2">
        <Label htmlFor="groupSize">Group size</Label>
        <Input
          id="groupSize"
          type="number"
          min={2}
          value={groupSize}
          onChange={(e) => setGroupSize(e.target.value)}
          className="w-24"
        />
      </div>
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Generating…" : "Generate groups"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

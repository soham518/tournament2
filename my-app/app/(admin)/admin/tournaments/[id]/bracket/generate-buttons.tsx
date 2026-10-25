"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateKnockoutStageAction, generateGroupStageAction } from "@/lib/actions/bracket";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswFieldError } from "@/components/usw/field-error";

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
      <UswButton onClick={handleClick} disabled={isPending}>
        {isPending ? "Generating…" : "Generate bracket"}
      </UswButton>
      <UswFieldError>{error}</UswFieldError>
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
        <UswLabel htmlFor="groupSize">Group size</UswLabel>
        <UswInput
          id="groupSize"
          type="number"
          min={2}
          value={groupSize}
          onChange={(e) => setGroupSize(e.target.value)}
          className="w-24"
        />
      </div>
      <UswButton onClick={handleClick} disabled={isPending}>
        {isPending ? "Generating…" : "Generate groups"}
      </UswButton>
      <UswFieldError>{error}</UswFieldError>
    </div>
  );
}

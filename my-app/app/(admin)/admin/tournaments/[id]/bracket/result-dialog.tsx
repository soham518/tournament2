"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordOfficialResultAction } from "@/lib/actions/match";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import {
  UswDialog,
  UswDialogContent,
  UswDialogHeader,
  UswDialogTitle,
  UswDialogTrigger,
} from "@/components/usw/dialog";

export function ResultDialog({
  matchId,
  nameA,
  nameB,
}: {
  matchId: string;
  nameA: string;
  nameB: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<"A_WIN" | "B_WIN" | "FORFEIT_A" | "FORFEIT_B">("A_WIN");
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit() {
    setIsPending(true);
    const result = await recordOfficialResultAction(matchId, {
      outcome,
      scoreA: scoreA ? Number(scoreA) : undefined,
      scoreB: scoreB ? Number(scoreB) : undefined,
    });
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <UswDialog open={open} onOpenChange={setOpen}>
      <UswDialogTrigger render={<UswButton size="sm">Record result</UswButton>} />
      <UswDialogContent>
        <UswDialogHeader>
          <UswDialogTitle>
            {nameA} vs {nameB}
          </UswDialogTitle>
        </UswDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <UswLabel htmlFor="outcome">Outcome</UswLabel>
            <UswSelect
              id="outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as typeof outcome)}
            >
              <option value="A_WIN">{nameA} wins</option>
              <option value="B_WIN">{nameB} wins</option>
              <option value="FORFEIT_A">{nameA} forfeits</option>
              <option value="FORFEIT_B">{nameB} forfeits</option>
            </UswSelect>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <UswLabel htmlFor="scoreA">{nameA} score (optional)</UswLabel>
              <UswInput id="scoreA" type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
            </div>
            <div className="space-y-2">
              <UswLabel htmlFor="scoreB">{nameB} score (optional)</UswLabel>
              <UswInput id="scoreB" type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
            </div>
          </div>
          <UswFieldError>{error}</UswFieldError>
          <UswButton onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? "Saving…" : "Finalize result"}
          </UswButton>
        </div>
      </UswDialogContent>
    </UswDialog>
  );
}

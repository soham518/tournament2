"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "cn";
import { recordOfficialResultAction } from "@/lib/actions/match";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswCheckbox } from "@/components/usw/checkbox";
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
  const [winner, setWinner] = useState<"A" | "B" | null>(null);
  const [isForfeit, setIsForfeit] = useState(false);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  function reset() {
    setWinner(null);
    setIsForfeit(false);
    setScoreA("");
    setScoreB("");
    setError(null);
  }

  async function handleSubmit() {
    if (!winner) return;
    const outcome =
      winner === "A" ? (isForfeit ? "FORFEIT_A" : "A_WIN") : isForfeit ? "FORFEIT_B" : "B_WIN";
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
    reset();
    router.refresh();
  }

  return (
    <UswDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <UswDialogTrigger render={<UswButton size="sm">Record result</UswButton>} />
      <UswDialogContent>
        <UswDialogHeader>
          <UswDialogTitle>
            {nameA} vs {nameB}
          </UswDialogTitle>
        </UswDialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <UswLabel>Winner</UswLabel>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["A", nameA],
                  ["B", nameB],
                ] as const
              ).map(([slot, name]) => {
                const selected = winner === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setWinner(slot)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-sm px-3 py-3 text-left text-sm font-bold transition-colors ring-1 ring-inset",
                      selected
                        ? "ring-0 [background-color:var(--usw-primary-container)] text-[var(--usw-on-primary-container)]"
                        : "ring-[var(--usw-outline-variant)] text-[var(--usw-on-surface)] hover:ring-[var(--usw-primary)]"
                    )}
                  >
                    <span className="truncate">{name}</span>
                    {selected && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--usw-on-surface-variant)]">
            <UswCheckbox checked={isForfeit} onCheckedChange={(checked) => setIsForfeit(checked === true)} />
            Opponent forfeited
          </label>
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
          <UswButton onClick={handleSubmit} disabled={isPending || !winner} className="w-full">
            {isPending ? "Saving…" : "Finalize result"}
          </UswButton>
        </div>
      </UswDialogContent>
    </UswDialog>
  );
}

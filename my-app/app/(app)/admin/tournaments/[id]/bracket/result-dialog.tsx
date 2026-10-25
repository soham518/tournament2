"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordOfficialResultAction } from "@/lib/actions/match";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm">Record result</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {nameA} vs {nameB}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A_WIN">{nameA} wins</SelectItem>
                <SelectItem value="B_WIN">{nameB} wins</SelectItem>
                <SelectItem value="FORFEIT_A">{nameA} forfeits</SelectItem>
                <SelectItem value="FORFEIT_B">{nameB} forfeits</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scoreA">{nameA} score (optional)</Label>
              <Input id="scoreA" type="number" value={scoreA} onChange={(e) => setScoreA(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scoreB">{nameB} score (optional)</Label>
              <Input id="scoreB" type="number" value={scoreB} onChange={(e) => setScoreB(e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? "Saving…" : "Finalize result"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

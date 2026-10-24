"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerForTournamentAction } from "@/lib/actions/registration";
import { Button } from "@/components/ui/button";

export function RegisterButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleRegister() {
    setError(null);
    setIsPending(true);
    const result = await registerForTournamentAction(tournamentId);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push(`/dashboard/registrations/${result.registrationId}`);
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleRegister} disabled={isPending}>
        {isPending ? "Registering…" : "Register"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

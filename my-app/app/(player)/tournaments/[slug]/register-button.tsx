"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerForTournamentAction } from "@/lib/actions/registration";
import { UswButton } from "@/components/usw/button";
import { UswFieldError } from "@/components/usw/field-error";

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
      <UswButton onClick={handleRegister} disabled={isPending}>
        {isPending ? "Registering…" : "Register"}
      </UswButton>
      <UswFieldError>{error}</UswFieldError>
    </div>
  );
}

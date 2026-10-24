"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setFighterAvailabilityAction } from "@/lib/actions/fighter";

export function AvailabilityToggle({ id, isAvailable }: { id: string; isAvailable: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isAvailable}
      disabled={isPending}
      onCheckedChange={(checked) => {
        startTransition(() => setFighterAvailabilityAction(id, checked));
      }}
    />
  );
}

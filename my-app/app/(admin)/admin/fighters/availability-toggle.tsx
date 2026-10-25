"use client";

import { useTransition } from "react";
import { UswSwitch } from "@/components/usw/switch";
import { setFighterAvailabilityAction } from "@/lib/actions/fighter";

export function AvailabilityToggle({ id, isAvailable }: { id: string; isAvailable: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <UswSwitch
      checked={isAvailable}
      disabled={isPending}
      onCheckedChange={(checked) => {
        startTransition(() => setFighterAvailabilityAction(id, checked));
      }}
    />
  );
}

"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "cn";

export function UswSwitch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex h-[18.4px] w-[32px] shrink-0 items-center rounded-full outline-none transition-colors data-[checked]:[background-color:var(--usw-primary-container)] data-[unchecked]:bg-[var(--usw-surface-container-highest)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-4 translate-x-0 rounded-full bg-[var(--usw-on-surface)] transition-transform data-[checked]:translate-x-[calc(100%-2px)]" />
    </SwitchPrimitive.Root>
  );
}

import { cn } from "cn";
import type { ComponentProps } from "react";

export function UswInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "font-[family-name:var(--font-space-mono)] h-11 w-full bg-[var(--usw-surface-container-lowest)] px-3 text-sm text-[var(--usw-on-surface)] outline-none ring-1 ring-inset ring-[var(--usw-outline-variant)] placeholder:text-[var(--usw-outline)] focus:ring-[var(--usw-secondary-fixed-dim)]",
        className
      )}
      {...props}
    />
  );
}

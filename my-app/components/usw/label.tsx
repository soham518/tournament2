import { cn } from "cn";
import type { ComponentProps } from "react";

export function UswLabel({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "font-[family-name:var(--font-space-mono)] text-[11px] uppercase tracking-wider text-[var(--usw-on-surface-variant)]",
        className
      )}
      {...props}
    />
  );
}

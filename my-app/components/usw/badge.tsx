import { cn } from "cn";
import type { ComponentProps } from "react";

const variants = {
  default: "[background-color:var(--usw-primary-container)] text-[var(--usw-on-primary-container)]",
  secondary: "bg-[var(--usw-surface-container-high)] text-[var(--usw-on-surface)]",
  outline: "ring-1 ring-inset ring-[var(--usw-outline-variant)] text-[var(--usw-on-surface-variant)]",
  live: "text-[var(--usw-secondary-fixed-dim)]",
} as const;

export function UswBadge({
  variant = "default",
  className,
  ...props
}: { variant?: keyof typeof variants } & ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-space-mono)] inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

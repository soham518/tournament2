import { cn } from "cn";
import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

export function UswSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "font-[family-name:var(--font-space-mono)] h-11 w-full appearance-none bg-[var(--usw-surface-container-lowest)] px-3 pr-9 text-sm text-[var(--usw-on-surface)] outline-none ring-1 ring-inset ring-[var(--usw-outline-variant)] focus:ring-[var(--usw-secondary-fixed-dim)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--usw-primary)]" />
    </div>
  );
}

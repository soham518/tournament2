import { cn } from "cn";
import type { ComponentProps } from "react";

export function UswPanel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-[var(--usw-surface-container-low)] p-4 shadow-md sm:p-6", className)}
      {...props}
    />
  );
}

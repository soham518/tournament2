import { cn } from "cn";
import type { ComponentProps } from "react";

export function UswTable({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        className={cn("font-[family-name:var(--font-space-mono)] w-full text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function UswTableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("border-b border-[var(--usw-outline-variant)] text-[var(--usw-on-surface-variant)]", className)}
      {...props}
    />
  );
}

export function UswTableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("text-[var(--usw-on-surface)]", className)} {...props} />;
}

export function UswTableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-b border-[var(--usw-outline-variant)]/40 last:border-0", className)}
      {...props}
    />
  );
}

export function UswTableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn("whitespace-nowrap px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider", className)}
      {...props}
    />
  );
}

export function UswTableCell({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-2 py-2 align-middle", className)} {...props} />;
}

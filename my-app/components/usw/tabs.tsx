"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "cn";

export function UswTabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function UswTabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      className={cn(
        "font-[family-name:var(--font-space-mono)] flex w-fit gap-1 overflow-x-auto bg-[var(--usw-surface-container-low)] p-1",
        className
      )}
      {...props}
    />
  );
}

export function UswTabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "whitespace-nowrap px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--usw-on-surface-variant)] transition-colors data-[selected]:bg-[var(--usw-surface-container-high)] data-[selected]:text-[var(--usw-secondary-fixed-dim)]",
        className
      )}
      {...props}
    />
  );
}

export function UswTabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel className={cn("flex-1 text-sm outline-none", className)} {...props} />;
}

import Link from "next/link";
import { cn } from "cn";
import type { ComponentProps } from "react";

const base =
  "font-[family-name:var(--font-space-grotesk)] inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap px-4 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary:
    "text-[var(--usw-on-primary-container)] shadow-[0_0_12px_rgba(245,158,11,0.35)] [background-color:var(--usw-primary-container)] hover:brightness-110",
  outline:
    "bg-[var(--usw-surface-container-high)] text-[var(--usw-on-surface)] hover:text-[var(--usw-secondary-fixed-dim)]",
  ghost: "text-[var(--usw-on-surface-variant)] hover:text-[var(--usw-on-surface)]",
  destructive: "text-[var(--usw-error)] bg-[var(--usw-surface-container-high)] hover:brightness-110",
} as const;

const sizes = {
  default: "h-11 px-4",
  sm: "h-9 px-3 text-[11px]",
} as const;

type UswButtonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  href?: string;
  className?: string;
};

export function UswButton({
  variant = "primary",
  size = "default",
  href,
  className,
  ...props
}: UswButtonProps & (ComponentProps<"button"> | ComponentProps<"a">)) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return <Link href={href} className={classes} {...(props as ComponentProps<"a">)} />;
  }
  return <button type="button" className={classes} {...(props as ComponentProps<"button">)} />;
}

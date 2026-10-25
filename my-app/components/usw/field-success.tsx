export function UswFieldSuccess({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="font-[family-name:var(--font-space-mono)] text-xs text-[var(--usw-secondary-fixed-dim)]">
      {children}
    </p>
  );
}

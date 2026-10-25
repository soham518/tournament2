import Link from "next/link";
import { User } from "lucide-react";

export function LandingHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-[var(--usw-surface-container-lowest)]/85 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between gap-2 px-4 sm:px-8">
        <div className="flex min-w-0 flex-col">
          <span className="font-[family-name:var(--font-space-mono)] truncate text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--usw-secondary-fixed-dim)] [text-shadow:0_0_8px_rgba(0,218,243,0.6)] sm:text-[11px] sm:tracking-[0.2em]">
            Ultimate Shadow Warrior
          </span>
          <span className="font-[family-name:var(--font-space-grotesk)] truncate text-base leading-none font-semibold text-[var(--usw-on-surface)] sm:text-lg">
            Tournaments
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* The bottom nav covers this destination on mobile; shown here only on desktop, which has no bottom nav. */}
          <Link
            href="/tournaments"
            className="font-[family-name:var(--font-space-mono)] hidden h-11 items-center px-3 text-xs font-bold uppercase tracking-wider text-[var(--usw-on-surface)] transition-colors hover:text-[var(--usw-secondary-fixed-dim)] sm:flex"
          >
            Tournaments
          </Link>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--usw-primary)]"
            >
              <User className="h-[18px] w-[18px] text-[var(--usw-on-primary)]" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="font-[family-name:var(--font-space-mono)] flex h-11 items-center px-1.5 text-[11px] uppercase text-[var(--usw-tertiary)] transition-colors hover:text-[var(--usw-tertiary-container)] sm:px-2 sm:text-xs"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="font-[family-name:var(--font-space-mono)] flex h-11 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--usw-on-primary-container)] shadow-[0_0_12px_rgba(245,158,11,0.35)] sm:px-3 sm:text-xs"
                style={{ backgroundColor: "var(--usw-primary-container)" }}
              >
                Signup
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

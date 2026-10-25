import Link from "next/link";
import { Trophy, ShieldUser } from "lucide-react";

// Only two destinations are real pages today (Tournaments, Dashboard/login).
// The design calls for a 4-icon nav; the other two are kept visually but
// point at the closest real equivalent rather than a dead link, until
// dedicated live-match and leaderboard pages exist.
export function LandingBottomNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const items = [
    { href: "/tournaments", label: "Arena", icon: Trophy, active: true },
    { href: isLoggedIn ? "/dashboard" : "/login", label: "Dossier", icon: ShieldUser, active: false },
  ];

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-white/5 bg-[var(--usw-surface-container-lowest)]/90 backdrop-blur-xl sm:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-h-11 min-w-11 flex-col items-center justify-center transition-colors"
            style={{ color: item.active ? "var(--usw-secondary-fixed-dim)" : "var(--usw-on-surface-variant)" }}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-[family-name:var(--font-space-mono)] mt-0.5 text-[10px] uppercase">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

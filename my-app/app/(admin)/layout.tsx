import Link from "next/link";
import { getSessionUser } from "@/lib/auth/guards";
import { UswHeader } from "@/components/usw/header";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tournaments", label: "Tournaments" },
];

const SUPER_ADMIN_LINKS = [
  { href: "/admin/fighters", label: "Fighters" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const links = user?.role === "SUPER_ADMIN" ? [...ADMIN_LINKS, ...SUPER_ADMIN_LINKS] : ADMIN_LINKS;

  return (
    <div className="flex min-h-screen flex-col">
      <UswHeader />
      {/* UswHeader is fixed (removed from flow), so this sticky nav's natural
          position must be pushed down by the header's height (80px = pt-20)
          or it renders hidden underneath the header until the page scrolls. */}
      <nav className="sticky top-20 z-40 mt-20 flex gap-1 overflow-x-auto border-b border-white/5 bg-[var(--usw-surface-container-lowest)]/85 px-4 py-2 backdrop-blur-xl sm:px-8">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-[family-name:var(--font-space-mono)] whitespace-nowrap px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--usw-on-surface-variant)] transition-colors hover:text-[var(--usw-secondary-fixed-dim)]"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}

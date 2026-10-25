import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeDisplayStatus, DISPLAY_STATUS_LABEL, type DisplayStatus } from "@/lib/tournaments/status";
import { formatPaiseAsInr } from "@/lib/money";
import { UswBadge } from "@/components/usw/badge";
import { UswButton } from "@/components/usw/button";
import { UswPanel } from "@/components/usw/panel";

type Filter = "upcoming" | "registration_open" | "free" | "paid" | "1v1" | "3v3" | "completed";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "registration_open", label: "Registration Open" },
  { key: "free", label: "Free" },
  { key: "paid", label: "Paid" },
  { key: "1v1", label: "1v1" },
  { key: "3v3", label: "3v3" },
  { key: "completed", label: "Completed" },
];

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  const tournaments = await prisma.tournament.findMany({
    where: { status: "PUBLISHED" },
    include: { _count: { select: { registrations: { where: { status: "APPROVED" } } } } },
    orderBy: { startAt: "asc" },
  });

  const withStatus = tournaments.map((t) => ({
    tournament: t,
    displayStatus: computeDisplayStatus(t, t._count.registrations),
  }));

  const filtered = withStatus.filter(({ tournament, displayStatus }) => {
    switch (filter as Filter | undefined) {
      case "upcoming":
        return displayStatus === "UPCOMING";
      case "registration_open":
        return displayStatus === "REGISTRATION_OPEN";
      case "free":
        return !tournament.isPaid;
      case "paid":
        return tournament.isPaid;
      case "1v1":
        return tournament.mode === "ONE_V_ONE";
      case "3v3":
        return tournament.mode === "THREE_V_THREE";
      case "completed":
        return displayStatus === "COMPLETED";
      default:
        return true;
    }
  });

  return (
    <div className="mx-auto w-full max-w-5xl py-2">
      <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
        [Arena Circuits]
      </span>
      <h1 className="font-[family-name:var(--font-space-grotesk)] mb-1 mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Tournaments
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] mb-6 text-sm text-[var(--usw-on-surface-variant)]">
        Browse and register for upcoming Shadow Fight Arena tournaments.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <UswButton
          variant={!filter ? "primary" : "outline"}
          size="sm"
          href="/tournaments"
        >
          All
        </UswButton>
        {FILTERS.map((f) => (
          <UswButton
            key={f.key}
            variant={filter === f.key ? "primary" : "outline"}
            size="sm"
            href={`/tournaments?filter=${f.key}`}
          >
            {f.label}
          </UswButton>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          No tournaments match this filter.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(({ tournament, displayStatus }) => (
            <TournamentCard key={tournament.id} tournament={tournament} displayStatus={displayStatus} confirmedCount={tournament._count.registrations} />
          ))}
        </div>
      )}
    </div>
  );
}

function TournamentCard({
  tournament,
  displayStatus,
  confirmedCount,
}: {
  tournament: { slug: string; name: string; mode: string; isPaid: boolean; entryFeePaise: number | null; maxParticipants: number; registrationClosesAt: Date };
  displayStatus: DisplayStatus;
  confirmedCount: number;
}) {
  return (
    <Link href={`/tournaments/${tournament.slug}`}>
      <UswPanel className="h-full transition-colors hover:ring-1 hover:ring-[var(--usw-secondary-fixed-dim)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-[family-name:var(--font-space-grotesk)] text-base font-bold uppercase text-[var(--usw-on-surface)]">
            {tournament.name}
          </h3>
          <UswBadge variant="secondary">{DISPLAY_STATUS_LABEL[displayStatus]}</UswBadge>
        </div>
        <div className="font-[family-name:var(--font-space-mono)] space-y-1 text-sm text-[var(--usw-on-surface-variant)]">
          <p>{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</p>
          <p>{tournament.isPaid ? formatPaiseAsInr(tournament.entryFeePaise) + " entry" : "Free entry"}</p>
          <p>
            {confirmedCount} / {tournament.maxParticipants} registered
          </p>
          <p>Registration closes {tournament.registrationClosesAt.toLocaleString()}</p>
        </div>
      </UswPanel>
    </Link>
  );
}

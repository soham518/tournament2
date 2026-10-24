import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeDisplayStatus, DISPLAY_STATUS_LABEL, type DisplayStatus } from "@/lib/tournaments/status";
import { formatPaiseAsInr } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto w-full max-w-5xl py-16">
      <h1 className="mb-1 text-2xl font-semibold">Tournaments</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Browse and register for upcoming Shadow Fight Arena tournaments.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant={!filter ? "default" : "outline"} size="sm" render={<Link href="/tournaments">All</Link>} />
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            render={<Link href={`/tournaments?filter=${f.key}`}>{f.label}</Link>}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tournaments match this filter.</p>
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
      <Card className="h-full transition-colors hover:border-foreground/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{tournament.name}</CardTitle>
            <Badge variant="secondary">{DISPLAY_STATUS_LABEL[displayStatus]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{tournament.mode === "ONE_V_ONE" ? "1v1" : "3v3"}</p>
          <p>{tournament.isPaid ? formatPaiseAsInr(tournament.entryFeePaise) + " entry" : "Free entry"}</p>
          <p>
            {confirmedCount} / {tournament.maxParticipants} registered
          </p>
          <p>Registration closes {tournament.registrationClosesAt.toLocaleString()}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

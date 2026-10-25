import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeGroupStandings } from "@/lib/tournaments/standings";
import { Badge } from "@/components/ui/badge";

export default async function PublicBracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { slug },
    include: {
      stages: {
        include: {
          groups: { include: { members: true } },
          matches: {
            include: {
              participants: {
                include: { registration: { include: { player: { select: { username: true } } } } },
              },
            },
            orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
          },
        },
      },
    },
  });
  if (!tournament || tournament.status === "DRAFT") notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-16">
      <div>
        <Link href={`/tournaments/${slug}`} className="text-sm text-muted-foreground underline">
          ← {tournament.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Bracket &amp; standings</h1>
      </div>

      {tournament.stages.length === 0 && (
        <p className="text-sm text-muted-foreground">The bracket hasn&apos;t been generated yet.</p>
      )}

      {tournament.stages.map((stage) => (
        <section key={stage.id} className="space-y-6">
          <h2 className="text-lg font-medium">{stage.name}</h2>

          {stage.type === "GROUP" &&
            stage.groups.map((group) => {
              const standings = computeGroupStandings(
                group.id,
                group.members.map((m) => m.registrationId),
                stage.matches.map((m) => ({
                  groupId: m.groupId,
                  status: m.status,
                  winnerRegistrationId: m.winnerRegistrationId,
                  participants: m.participants.map((p) => ({ registrationId: p.registrationId, slot: p.slot })),
                }))
              );
              const nameFor = (registrationId: string) =>
                stage.matches
                  .flatMap((m) => m.participants)
                  .find((p) => p.registrationId === registrationId)?.registration.player.username ?? "—";
              return (
                <div key={group.id} className="rounded-md border p-4">
                  <h3 className="mb-2 font-medium">{group.name}</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th>Player</th>
                        <th>W</th>
                        <th>L</th>
                        <th>D</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((s) => (
                        <tr key={s.registrationId}>
                          <td>{nameFor(s.registrationId)}</td>
                          <td>{s.wins}</td>
                          <td>{s.losses}</td>
                          <td>{s.draws}</td>
                          <td>{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}

          {Array.from(new Set(stage.matches.map((m) => m.round))).map((round) => (
            <div key={round}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">Round {round}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {stage.matches
                  .filter((m) => m.round === round)
                  .map((match) => {
                    const a = match.participants.find((p) => p.slot === "A");
                    const b = match.participants.find((p) => p.slot === "B");
                    return (
                      <div key={match.id} className="rounded-md border p-3 text-sm">
                        <p>
                          {a?.registration.player.username ?? "TBD"} vs{" "}
                          {b?.registration.player.username ?? "TBD"}
                          {match.isThirdPlace && " (3rd place)"}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {match.status}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

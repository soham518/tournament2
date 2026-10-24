import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeGroupStandings } from "@/lib/tournaments/standings";
import { Badge } from "@/components/ui/badge";
import { GenerateBracketButton, GenerateGroupStageButton } from "./generate-buttons";
import { ResultDialog } from "./result-dialog";

export default async function AdminBracketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTournamentAdmin(id);

  const tournament = await prisma.tournament.findUnique({
    where: { id },
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
  if (!tournament) notFound();

  const hasStage = tournament.stages.length > 0;
  const participantName = (registrationId: string | null, matches: typeof tournament.stages[0]["matches"]) => {
    if (!registrationId) return "TBD";
    for (const m of matches) {
      const p = m.participants.find((p) => p.registrationId === registrationId);
      if (p) return p.registration.player.username;
    }
    return "Unknown";
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-16">
      <h1 className="text-2xl font-semibold">{tournament.name} — Bracket</h1>

      {!hasStage && (
        <div className="space-y-4 rounded-md border p-4">
          <p className="text-sm text-muted-foreground">
            No bracket or group stage has been generated yet. Only approved registrations are
            included.
          </p>
          {tournament.structureType === "KNOCKOUT" && <GenerateBracketButton tournamentId={id} />}
          {(tournament.structureType === "GROUP" || tournament.structureType === "GROUP_THEN_KNOCKOUT") && (
            <GenerateGroupStageButton tournamentId={id} />
          )}
        </div>
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
                  participants: m.participants.map((p) => ({
                    registrationId: p.registrationId,
                    slot: p.slot,
                  })),
                }))
              );
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
                          <td>{participantName(s.registrationId, stage.matches)}</td>
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
                    const nameA = a?.registration.player.username ?? "TBD";
                    const nameB = b?.registration.player.username ?? "TBD";
                    return (
                      <div key={match.id} className="flex items-center justify-between rounded-md border p-3">
                        <div className="text-sm">
                          <p>
                            {nameA} vs {nameB}
                            {match.isThirdPlace && " (3rd place)"}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            {match.status}
                          </Badge>
                        </div>
                        {match.status === "SCHEDULED" && a && b && (
                          <ResultDialog matchId={match.id} nameA={nameA} nameB={nameB} />
                        )}
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

import { notFound } from "next/navigation";
import { requireTournamentAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeGroupStandings } from "@/lib/tournaments/standings";
import { UswBadge } from "@/components/usw/badge";
import { UswPanel } from "@/components/usw/panel";
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
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        {tournament.name} — Bracket
      </h1>

      {!hasStage && (
        <UswPanel className="space-y-4">
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            No bracket or group stage has been generated yet. Only approved registrations are
            included.
          </p>
          {tournament.structureType === "KNOCKOUT" && <GenerateBracketButton tournamentId={id} />}
          {(tournament.structureType === "GROUP" || tournament.structureType === "GROUP_THEN_KNOCKOUT") && (
            <GenerateGroupStageButton tournamentId={id} />
          )}
        </UswPanel>
      )}

      {tournament.stages.map((stage) => (
        <section key={stage.id} className="space-y-6">
          <h2 className="font-[family-name:var(--font-space-grotesk)] text-lg font-bold uppercase text-[var(--usw-on-surface)]">
            {stage.name}
          </h2>

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
                <UswPanel key={group.id}>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] mb-2 font-bold uppercase text-[var(--usw-on-surface)]">
                    {group.name}
                  </h3>
                  <table className="font-[family-name:var(--font-space-mono)] w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--usw-on-surface-variant)]">
                        <th>Player</th>
                        <th>W</th>
                        <th>L</th>
                        <th>D</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--usw-on-surface)]">
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
                </UswPanel>
              );
            })}

          {Array.from(new Set(stage.matches.map((m) => m.round))).map((round) => (
            <div key={round}>
              <h3 className="font-[family-name:var(--font-space-mono)] mb-2 text-sm text-[var(--usw-on-surface-variant)]">
                Round {round}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {stage.matches
                  .filter((m) => m.round === round)
                  .map((match) => {
                    const a = match.participants.find((p) => p.slot === "A");
                    const b = match.participants.find((p) => p.slot === "B");
                    const nameA = a?.registration.player.username ?? "TBD";
                    const nameB = b?.registration.player.username ?? "TBD";
                    return (
                      <UswPanel key={match.id} className="flex items-center justify-between p-3">
                        <div className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface)]">
                          <p>
                            {nameA} vs {nameB}
                            {match.isThirdPlace && " (3rd place)"}
                          </p>
                          <UswBadge variant="secondary" className="mt-1">
                            {match.status}
                          </UswBadge>
                        </div>
                        {match.status === "SCHEDULED" && a && b && (
                          <ResultDialog matchId={match.id} nameA={nameA} nameB={nameB} />
                        )}
                      </UswPanel>
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

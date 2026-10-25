import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeGroupStandings } from "@/lib/tournaments/standings";
import { UswBadge } from "@/components/usw/badge";
import { UswPanel } from "@/components/usw/panel";

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
    <div className="mx-auto w-full max-w-4xl space-y-8 py-2">
      <div>
        <Link
          href={`/tournaments/${slug}`}
          className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)] underline"
        >
          ← {tournament.name}
        </Link>
        <h1 className="font-[family-name:var(--font-space-grotesk)] mt-2 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
          Bracket &amp; standings
        </h1>
      </div>

      {tournament.stages.length === 0 && (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          The bracket hasn&apos;t been generated yet.
        </p>
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
                  participants: m.participants.map((p) => ({ registrationId: p.registrationId, slot: p.slot })),
                }))
              );
              const nameFor = (registrationId: string) =>
                stage.matches
                  .flatMap((m) => m.participants)
                  .find((p) => p.registrationId === registrationId)?.registration.player.username ?? "—";
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
                          <td>{nameFor(s.registrationId)}</td>
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
                    return (
                      <UswPanel key={match.id} className="p-3">
                        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface)]">
                          {a?.registration.player.username ?? "TBD"} vs{" "}
                          {b?.registration.player.username ?? "TBD"}
                          {match.isThirdPlace && " (3rd place)"}
                        </p>
                        <UswBadge variant="secondary" className="mt-1">
                          {match.status}
                        </UswBadge>
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

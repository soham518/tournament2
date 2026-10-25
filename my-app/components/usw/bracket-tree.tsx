import { cn } from "cn";
import { UswBadge } from "./badge";
import { UswPanel } from "./panel";

export type BracketTreeParticipant = { registrationId: string; name: string };

export type BracketTreeMatch = {
  id: string;
  round: number;
  matchNumber: number;
  isThirdPlace: boolean;
  status: string;
  participantA: BracketTreeParticipant | null;
  participantB: BracketTreeParticipant | null;
  winnerRegistrationId: string | null;
};

function roundLabel(round: number, totalRounds: number, matchesInRound: number) {
  if (matchesInRound === 1) return "Final";
  if (matchesInRound === 2) return "Semifinals";
  if (matchesInRound === 4) return "Quarterfinals";
  return `Round ${round} of ${totalRounds}`;
}

export function UswBracketTree({
  matches,
  renderActions,
}: {
  matches: BracketTreeMatch[];
  renderActions?: (match: BracketTreeMatch) => React.ReactNode;
}) {
  const mainMatches = matches.filter((m) => !m.isThirdPlace);
  const thirdPlace = matches.find((m) => m.isThirdPlace);
  const rounds = Array.from(new Set(mainMatches.map((m) => m.round))).sort((a, b) => a - b);

  if (rounds.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-6 overflow-x-auto pb-2">
        {rounds.map((round) => {
          const roundMatches = mainMatches
            .filter((m) => m.round === round)
            .sort((a, b) => a.matchNumber - b.matchNumber);
          return (
            <div key={round} className="flex min-w-[220px] flex-1 flex-col gap-4">
              <h3 className="font-[family-name:var(--font-space-mono)] text-center text-[11px] font-bold uppercase tracking-wider text-[var(--usw-secondary-fixed-dim)]">
                {roundLabel(round, rounds.length, roundMatches.length)}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-6">
                {roundMatches.map((match) => (
                  <BracketMatchCard key={match.id} match={match} actions={renderActions?.(match)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {thirdPlace && (
        <div className="max-w-xs">
          <h3 className="font-[family-name:var(--font-space-mono)] mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-[var(--usw-secondary-fixed-dim)]">
            3rd place
          </h3>
          <BracketMatchCard match={thirdPlace} actions={renderActions?.(thirdPlace)} />
        </div>
      )}
    </div>
  );
}

function BracketMatchCard({ match, actions }: { match: BracketTreeMatch; actions?: React.ReactNode }) {
  return (
    <UswPanel
      className={cn(
        "space-y-2 p-3",
        match.status === "COMPLETED" && "ring-1 ring-inset ring-[var(--usw-primary)]/40"
      )}
    >
      <BracketPlayerRow participant={match.participantA} winnerRegistrationId={match.winnerRegistrationId} />
      <BracketPlayerRow participant={match.participantB} winnerRegistrationId={match.winnerRegistrationId} />
      <div className="flex items-center justify-between gap-2 pt-1">
        <UswBadge variant="secondary">{match.status}</UswBadge>
        {actions}
      </div>
    </UswPanel>
  );
}

function BracketPlayerRow({
  participant,
  winnerRegistrationId,
}: {
  participant: BracketTreeParticipant | null;
  winnerRegistrationId: string | null;
}) {
  const isWinner = Boolean(participant && winnerRegistrationId === participant.registrationId);
  return (
    <p
      className={cn(
        "font-[family-name:var(--font-space-mono)] truncate text-sm",
        isWinner ? "font-bold text-[var(--usw-on-surface)]" : "text-[var(--usw-on-surface-variant)]"
      )}
    >
      {participant?.name ?? "TBD"}
      {isWinner && " ✓"}
    </p>
  );
}

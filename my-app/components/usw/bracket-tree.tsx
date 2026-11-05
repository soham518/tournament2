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

const LIVE_STATUSES = new Set(["PENDING", "SCHEDULED", "IN_PROGRESS", "RESULT_SUBMITTED", "UNDER_DISPUTE"]);

function roundLabel(round: number, totalRounds: number, matchesInRound: number) {
  if (matchesInRound === 1) return "Final";
  if (matchesInRound === 2) return "Semifinals";
  if (matchesInRound === 4) return "Quarterfinals";
  return `Round ${round} of ${totalRounds}`;
}

function involvesPlayer(match: BracketTreeMatch, registrationId: string) {
  return match.participantA?.registrationId === registrationId || match.participantB?.registrationId === registrationId;
}

// A Server Component on purpose: the admin bracket page passes a raw
// `renderActions` function (closing over <ResultDialog>), which can only
// cross a server->client boundary as already-rendered JSX, not as a
// function prop. So round-switching on mobile is CSS-only scroll-snap
// (each round is a full-width swipe stop) rather than client-side tab
// state, keeping this component server-renderable for both callers.
export function UswBracketTree({
  matches,
  renderActions,
  currentUserRegistrationId,
}: {
  matches: BracketTreeMatch[];
  renderActions?: (match: BracketTreeMatch) => React.ReactNode;
  currentUserRegistrationId?: string | null;
}) {
  const mainMatches = matches.filter((m) => !m.isThirdPlace);
  const thirdPlace = matches.find((m) => m.isThirdPlace);
  const rounds = Array.from(new Set(mainMatches.map((m) => m.round))).sort((a, b) => a - b);

  if (rounds.length === 0) return null;

  const myNextMatch = currentUserRegistrationId
    ? matches
        .filter((m) => involvesPlayer(m, currentUserRegistrationId) && LIVE_STATUSES.has(m.status))
        .sort((a, b) => a.round - b.round)[0]
    : undefined;

  return (
    <div className="space-y-6">
      {myNextMatch && (
        <a
          href={`#match-${myNextMatch.id}`}
          className="font-[family-name:var(--font-space-mono)] inline-flex h-9 items-center px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--usw-on-primary-container)] shadow-[0_0_12px_rgba(245,158,11,0.35)]"
          style={{ backgroundColor: "var(--usw-primary-container)" }}
        >
          Jump to my match →
        </a>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:gap-6 sm:snap-none">
        {rounds.map((round) => {
          const roundMatches = mainMatches
            .filter((m) => m.round === round)
            .sort((a, b) => a.matchNumber - b.matchNumber);
          return (
            <div
              key={round}
              className="flex w-[82vw] shrink-0 snap-center flex-col gap-4 sm:w-auto sm:min-w-[220px] sm:flex-1 sm:shrink sm:snap-none"
            >
              <h3 className="font-[family-name:var(--font-space-mono)] text-center text-[11px] font-bold uppercase tracking-wider text-[var(--usw-secondary-fixed-dim)]">
                {roundLabel(round, rounds.length, roundMatches.length)}
              </h3>
              <p className="font-[family-name:var(--font-space-mono)] -mt-2 text-center text-[10px] text-[var(--usw-outline)]">
                {roundMatches.length} match{roundMatches.length === 1 ? "" : "es"}
              </p>
              <div className="flex flex-1 flex-col justify-around gap-6">
                {roundMatches.map((match) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    actions={renderActions?.(match)}
                    currentUserRegistrationId={currentUserRegistrationId}
                  />
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
          <BracketMatchCard
            match={thirdPlace}
            actions={renderActions?.(thirdPlace)}
            currentUserRegistrationId={currentUserRegistrationId}
          />
        </div>
      )}
    </div>
  );
}

function BracketMatchCard({
  match,
  actions,
  currentUserRegistrationId,
}: {
  match: BracketTreeMatch;
  actions?: React.ReactNode;
  currentUserRegistrationId?: string | null;
}) {
  const isMyMatch = Boolean(currentUserRegistrationId && involvesPlayer(match, currentUserRegistrationId));
  return (
    <UswPanel
      id={`match-${match.id}`}
      className={cn(
        "scroll-mt-24 space-y-2 p-3",
        match.status === "COMPLETED" && "ring-1 ring-inset ring-[var(--usw-primary)]/40",
        isMyMatch && "ring-2 ring-inset ring-[var(--usw-secondary-fixed-dim)]"
      )}
    >
      <BracketPlayerRow
        participant={match.participantA}
        winnerRegistrationId={match.winnerRegistrationId}
        currentUserRegistrationId={currentUserRegistrationId}
      />
      <BracketPlayerRow
        participant={match.participantB}
        winnerRegistrationId={match.winnerRegistrationId}
        currentUserRegistrationId={currentUserRegistrationId}
      />
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
  currentUserRegistrationId,
}: {
  participant: BracketTreeParticipant | null;
  winnerRegistrationId: string | null;
  currentUserRegistrationId?: string | null;
}) {
  const isWinner = Boolean(participant && winnerRegistrationId === participant.registrationId);
  const isMe = Boolean(participant && currentUserRegistrationId && participant.registrationId === currentUserRegistrationId);
  return (
    <p
      className={cn(
        "font-[family-name:var(--font-space-mono)] truncate text-sm",
        isWinner ? "font-bold text-[var(--usw-on-surface)]" : "text-[var(--usw-on-surface-variant)]",
        isMe && "text-[var(--usw-secondary-fixed-dim)]"
      )}
    >
      {participant?.name ?? "TBD"}
      {isMe && " (You)"}
      {isWinner && " ✓"}
    </p>
  );
}

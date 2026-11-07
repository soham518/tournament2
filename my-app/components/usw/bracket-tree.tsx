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
  advancesToMatchId: string | null;
};

const LIVE_STATUSES = new Set(["PENDING", "SCHEDULED", "IN_PROGRESS", "RESULT_SUBMITTED", "UNDER_DISPUTE"]);

// Connector-line layout constants (pixels). Fixed rather than
// content-driven so match centers can be computed with plain arithmetic
// server-side — no client JS/measurement needed to draw the SVG lines.
//
// CARD_H=140 (measured, not guessed — see git history) is tall enough for
// two participant rows plus the status badge + action button wrapping to
// their own line, at both the mobile and desktop column widths below; at
// narrower widths the badge/button row doesn't fit next to the two name
// rows on one line, so BracketMatchCard's bottom row wraps instead of
// clipping via overflow-hidden.
const CARD_H = 140;
const GAP_V = 24;
const SLOT_H = CARD_H + GAP_V;
const COLUMN_W = 220;
const GAP_H = 56;
const MOBILE_COLUMN_W = 150;
const MOBILE_GAP_H = 32;
const LINE_COLOR = "var(--usw-secondary-fixed-dim)";

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
// function prop. Both the mobile and desktop layouts below are plain
// horizontally-scrollable, absolutely-positioned columns (no client JS
// needed to switch rounds or measure anything), keeping this component
// server-renderable for both callers.
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

  const matchesByRound = rounds.map((round) =>
    mainMatches.filter((m) => m.round === round).sort((a, b) => a.matchNumber - b.matchNumber)
  );

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

      {/* Mobile: same absolute-positioned-columns + SVG-overlay technique as
          desktop, just narrower columns/gaps, in a horizontally scrollable
          strip — so connector lines are visible while swiping through
          rounds instead of only on desktop. */}
      <BracketColumns
        rounds={rounds}
        matchesByRound={matchesByRound}
        renderActions={renderActions}
        currentUserRegistrationId={currentUserRegistrationId}
        columnW={MOBILE_COLUMN_W}
        gapH={MOBILE_GAP_H}
        wrapperClassName="sm:hidden"
      />

      {/* Desktop: wider columns, more breathing room between rounds. */}
      <BracketColumns
        rounds={rounds}
        matchesByRound={matchesByRound}
        renderActions={renderActions}
        currentUserRegistrationId={currentUserRegistrationId}
        columnW={COLUMN_W}
        gapH={GAP_H}
        wrapperClassName="hidden sm:block"
      />

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

function BracketColumns({
  rounds,
  matchesByRound,
  renderActions,
  currentUserRegistrationId,
  columnW,
  gapH,
  wrapperClassName,
}: {
  rounds: number[];
  matchesByRound: BracketTreeMatch[][];
  renderActions?: (match: BracketTreeMatch) => React.ReactNode;
  currentUserRegistrationId?: string | null;
  columnW: number;
  gapH: number;
  wrapperClassName: string;
}) {
  const HEADER_H = 32;
  const round1Count = matchesByRound[0]?.length ?? 0;
  const bodyHeight = Math.max(round1Count * SLOT_H - GAP_V, CARD_H);
  const totalHeight = bodyHeight + HEADER_H;
  const totalWidth = rounds.length * columnW + (rounds.length - 1) * gapH;

  // Every match's vertical center is derived from data, not a closed-form
  // formula: round 1 centers come from index * slot height, and every
  // later round's center is the average of its two feeders' centers
  // (found via advancesToMatchId), which stays correct even with byes.
  // HEADER_H is baked in here (rather than via a negative top offset on
  // the heading) so headings never render above this container's own
  // top edge, which could otherwise overlap page content above it.
  const centerY = new Map<string, number>();
  matchesByRound[0]?.forEach((m, i) => centerY.set(m.id, i * SLOT_H + CARD_H / 2 + HEADER_H));
  for (let r = 1; r < matchesByRound.length; r++) {
    const prevRound = matchesByRound[r - 1];
    for (const match of matchesByRound[r]) {
      const feeders = prevRound.filter((m) => m.advancesToMatchId === match.id);
      const ys = feeders.map((f) => centerY.get(f.id)).filter((y): y is number => y !== undefined);
      centerY.set(match.id, ys.length > 0 ? ys.reduce((a, b) => a + b, 0) / ys.length : totalHeight / 2);
    }
  }

  const connectors: Array<{ key: string; d: string }> = [];
  for (let r = 0; r < matchesByRound.length - 1; r++) {
    const columnRightX = r * (columnW + gapH) + columnW;
    const midX = columnRightX + gapH / 2;
    const nextLeftX = columnRightX + gapH;
    const byNextMatch = new Map<string, BracketTreeMatch[]>();
    for (const match of matchesByRound[r]) {
      if (!match.advancesToMatchId) continue;
      const list = byNextMatch.get(match.advancesToMatchId) ?? [];
      list.push(match);
      byNextMatch.set(match.advancesToMatchId, list);
    }
    for (const nextMatch of matchesByRound[r + 1]) {
      const feeders = byNextMatch.get(nextMatch.id) ?? [];
      const nextY = centerY.get(nextMatch.id)!;
      if (feeders.length === 2) {
        const [y1, y2] = [centerY.get(feeders[0].id)!, centerY.get(feeders[1].id)!];
        connectors.push({
          key: `${feeders[0].id}-${feeders[1].id}`,
          d: `M ${columnRightX} ${y1} H ${midX} V ${y2} H ${columnRightX}`,
        });
        connectors.push({ key: `${nextMatch.id}-stub`, d: `M ${midX} ${nextY} H ${nextLeftX}` });
      } else if (feeders.length === 1) {
        const y1 = centerY.get(feeders[0].id)!;
        connectors.push({ key: `${feeders[0].id}-stub`, d: `M ${columnRightX} ${y1} H ${nextLeftX}` });
      }
    }
  }

  return (
    <div className={cn("overflow-x-auto pb-2", wrapperClassName)}>
      <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
        <svg
          className="pointer-events-none absolute inset-0"
          width={totalWidth}
          height={totalHeight}
          aria-hidden="true"
        >
          {connectors.map((c) => (
            <path key={c.key} d={c.d} fill="none" stroke={LINE_COLOR} strokeWidth={2} />
          ))}
        </svg>
        {rounds.map((round, r) => (
          <div
            key={round}
            className="absolute top-0"
            style={{ left: r * (columnW + gapH), width: columnW }}
          >
            <h3 className="font-[family-name:var(--font-space-mono)] absolute top-0 w-full text-center text-[11px] font-bold uppercase tracking-wider text-[var(--usw-secondary-fixed-dim)]">
              {roundLabel(round, rounds.length, matchesByRound[r].length)}
            </h3>
            {matchesByRound[r].map((match) => (
              <BracketMatchCard
                key={match.id}
                match={match}
                actions={renderActions?.(match)}
                currentUserRegistrationId={currentUserRegistrationId}
                style={{ position: "absolute", top: centerY.get(match.id)! - CARD_H / 2, height: CARD_H, width: columnW }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({
  match,
  actions,
  currentUserRegistrationId,
  style,
}: {
  match: BracketTreeMatch;
  actions?: React.ReactNode;
  currentUserRegistrationId?: string | null;
  style?: React.CSSProperties;
}) {
  const isMyMatch = Boolean(currentUserRegistrationId && involvesPlayer(match, currentUserRegistrationId));
  return (
    <UswPanel
      id={`match-${match.id}`}
      style={style}
      className={cn(
        "scroll-mt-24 space-y-1.5 overflow-hidden p-3",
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
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
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

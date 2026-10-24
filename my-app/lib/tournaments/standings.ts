// Standings are always recomputed from official match results rather than
// stored, so a corrected result can never leave a stale table behind.

export type StandingsMatch = {
  groupId: string | null;
  status: string;
  winnerRegistrationId: string | null;
  participants: { registrationId: string; slot: "A" | "B" }[];
};

export type GroupStanding = {
  registrationId: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  played: number;
};

const POINTS_PER_WIN = 3;
const POINTS_PER_DRAW = 1;

export function computeGroupStandings(
  groupId: string,
  registrationIds: string[],
  matches: StandingsMatch[]
): GroupStanding[] {
  const table = new Map<string, GroupStanding>();
  for (const id of registrationIds) {
    table.set(id, { registrationId: id, wins: 0, losses: 0, draws: 0, points: 0, played: 0 });
  }

  for (const match of matches) {
    if (match.groupId !== groupId || match.status !== "COMPLETED") continue;
    const [a, b] = match.participants;
    if (!a || !b) continue;

    const rowA = table.get(a.registrationId);
    const rowB = table.get(b.registrationId);
    if (!rowA || !rowB) continue;

    rowA.played += 1;
    rowB.played += 1;

    if (match.winnerRegistrationId === a.registrationId) {
      rowA.wins += 1;
      rowA.points += POINTS_PER_WIN;
      rowB.losses += 1;
    } else if (match.winnerRegistrationId === b.registrationId) {
      rowB.wins += 1;
      rowB.points += POINTS_PER_WIN;
      rowA.losses += 1;
    } else {
      rowA.draws += 1;
      rowB.draws += 1;
      rowA.points += POINTS_PER_DRAW;
      rowB.points += POINTS_PER_DRAW;
    }
  }

  return Array.from(table.values()).sort((x, y) => y.points - x.points || y.wins - x.wins);
}

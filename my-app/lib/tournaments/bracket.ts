// Pure knockout bracket generation. Kept framework/DB-free so it's easy to
// unit test: given a list of registration ids (already seeded in the order
// they should be placed), returns every match across every round plus the
// advancement links between them, with byes handled for participant counts
// that aren't a power of two.

export type BracketMatch = {
  round: number;
  matchNumber: number;
  participantAId: string | null;
  participantBId: string | null;
  isThirdPlace: boolean;
  // Index into the round above (1-based matchNumber within that round) this
  // match's winner feeds into, and which slot (A/B) it occupies there.
  advancesToMatchNumber: number | null;
  advancesToSlot: "A" | "B" | null;
};

function nextPowerOfTwo(n: number) {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Standard bracket-seeding order (1 vs N, 2 vs N-1, ...) so the top seeds
// are maximally spread apart until the final.
function seedOrder(size: number): number[] {
  if (size === 1) return [1];
  const half = seedOrder(size / 2);
  const result: number[] = [];
  for (const seed of half) {
    result.push(seed, size + 1 - seed);
  }
  return result;
}

export function generateKnockoutBracket(
  participantIds: string[],
  hasThirdPlaceMatch: boolean
): BracketMatch[] {
  const size = nextPowerOfTwo(participantIds.length);
  const order = seedOrder(size);
  // Slot index -> participant id, or null for a bye.
  const slots: (string | null)[] = order.map((seed) => participantIds[seed - 1] ?? null);

  const matches: BracketMatch[] = [];
  const totalRounds = Math.log2(size);
  let currentRoundMatchCount = size / 2;
  let roundSlots = slots;

  for (let round = 1; round <= totalRounds; round++) {
    const nextRoundSlots: (string | null)[] = [];
    for (let i = 0; i < currentRoundMatchCount; i++) {
      const a = roundSlots[i * 2];
      const b = roundSlots[i * 2 + 1];
      const matchNumber = i + 1;

      // A bye auto-resolves: the single present participant advances without
      // a match being played.
      const byeWinner = a === null ? b : b === null ? a : null;

      matches.push({
        round,
        matchNumber,
        participantAId: a,
        participantBId: b,
        isThirdPlace: false,
        advancesToMatchNumber: round < totalRounds ? Math.floor(i / 2) + 1 : null,
        advancesToSlot: round < totalRounds ? (i % 2 === 0 ? "A" : "B") : null,
      });

      nextRoundSlots.push(byeWinner);
    }
    roundSlots = nextRoundSlots;
    currentRoundMatchCount = Math.ceil(currentRoundMatchCount / 2);
  }

  if (hasThirdPlaceMatch && totalRounds >= 2) {
    matches.push({
      round: totalRounds,
      matchNumber: currentRoundMatchCount + 1,
      participantAId: null,
      participantBId: null,
      isThirdPlace: true,
      advancesToMatchNumber: null,
      advancesToSlot: null,
    });
  }

  return matches;
}

export function generateRoundRobinPairs<T>(participants: T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      pairs.push([participants[i], participants[j]]);
    }
  }
  return pairs;
}

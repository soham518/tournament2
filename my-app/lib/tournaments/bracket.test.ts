import { describe, it, expect } from "vitest";
import { generateKnockoutBracket, generateRoundRobinPairs } from "./bracket";

function participants(n: number) {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`);
}

describe("generateKnockoutBracket", () => {
  it("produces 3 round-1 matches and no byes for 8 participants (power of two)", () => {
    const matches = generateKnockoutBracket(participants(8), false);
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(4);
    for (const m of round1) {
      expect(m.participantAId).not.toBeNull();
      expect(m.participantBId).not.toBeNull();
    }
    expect(Math.max(...matches.map((m) => m.round))).toBe(3); // quarters, semis, final
  });

  it("gives 4 participants no byes and a 2-round bracket", () => {
    const matches = generateKnockoutBracket(participants(4), false);
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(2);
    expect(round1.every((m) => m.participantAId && m.participantBId)).toBe(true);
    expect(Math.max(...matches.map((m) => m.round))).toBe(2);
  });

  it("pads 6 participants up to 8 slots with byes", () => {
    const matches = generateKnockoutBracket(participants(6), false);
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(4);
    const byeCount = round1.filter((m) => m.participantAId === null || m.participantBId === null).length;
    expect(byeCount).toBe(2); // 8 slots - 6 real participants = 2 byes
  });

  it("pads 10 participants up to 16 slots with byes", () => {
    const matches = generateKnockoutBracket(participants(10), false);
    const round1 = matches.filter((m) => m.round === 1);
    expect(round1).toHaveLength(8);
    const byeCount = round1.filter((m) => m.participantAId === null || m.participantBId === null).length;
    expect(byeCount).toBe(6); // 16 slots - 10 real participants = 6 byes
    expect(Math.max(...matches.map((m) => m.round))).toBe(4);
  });

  it("every non-final match advances into exactly one slot of a later match", () => {
    const matches = generateKnockoutBracket(participants(8), false);
    const finalRound = Math.max(...matches.map((m) => m.round));
    for (const m of matches) {
      if (m.round < finalRound) {
        expect(m.advancesToMatchNumber).not.toBeNull();
        expect(m.advancesToSlot).not.toBeNull();
      } else {
        expect(m.advancesToMatchNumber).toBeNull();
      }
    }
  });

  it("adds a third-place match when requested and there are at least 2 rounds", () => {
    const withThird = generateKnockoutBracket(participants(8), true);
    const withoutThird = generateKnockoutBracket(participants(8), false);
    expect(withThird.filter((m) => m.isThirdPlace)).toHaveLength(1);
    expect(withoutThird.filter((m) => m.isThirdPlace)).toHaveLength(0);
  });

  it("seeds 1 and 2 are placed on opposite halves of the bracket", () => {
    const matches = generateKnockoutBracket(participants(8), false);
    const round1 = matches.filter((m) => m.round === 1);
    const matchWithSeed1 = round1.find((m) => m.participantAId === "p1" || m.participantBId === "p1");
    const matchWithSeed2 = round1.find((m) => m.participantAId === "p2" || m.participantBId === "p2");
    expect(matchWithSeed1?.matchNumber).not.toBe(matchWithSeed2?.matchNumber);
    // In a standard 8-bracket (seed order 1,8,4,5,2,7,3,6), seed 1 is in
    // match 1 (top half) and seed 2 is in match 3 (bottom half) — they can
    // only meet in the final.
    expect(matchWithSeed1?.matchNumber).toBe(1);
    expect(matchWithSeed2?.matchNumber).toBe(3);
  });
});

describe("generateRoundRobinPairs", () => {
  it("produces n*(n-1)/2 unique pairs for a group", () => {
    const pairs = generateRoundRobinPairs(["a", "b", "c", "d"]);
    expect(pairs).toHaveLength(6);
    const pairKeys = new Set(pairs.map(([x, y]) => [x, y].sort().join(",")));
    expect(pairKeys.size).toBe(6);
  });

  it("every participant plays every other participant exactly once", () => {
    const players = ["a", "b", "c", "d", "e"];
    const pairs = generateRoundRobinPairs(players);
    expect(pairs).toHaveLength(10);
    for (const p of players) {
      const matchesForP = pairs.filter(([x, y]) => x === p || y === p);
      expect(matchesForP).toHaveLength(players.length - 1);
    }
  });
});

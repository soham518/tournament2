import { describe, it, expect } from "vitest";
import { computeGroupStandings, type StandingsMatch } from "./standings";

describe("computeGroupStandings", () => {
  it("ranks winners above losers by points", () => {
    const matches: StandingsMatch[] = [
      {
        groupId: "g1",
        status: "COMPLETED",
        winnerRegistrationId: "a",
        participants: [
          { registrationId: "a", slot: "A" },
          { registrationId: "b", slot: "B" },
        ],
      },
    ];
    const standings = computeGroupStandings("g1", ["a", "b"], matches);
    expect(standings[0].registrationId).toBe("a");
    expect(standings[0].wins).toBe(1);
    expect(standings[0].points).toBe(3);
    expect(standings[1].losses).toBe(1);
  });

  it("ignores matches from other groups and non-completed matches", () => {
    const matches: StandingsMatch[] = [
      {
        groupId: "other-group",
        status: "COMPLETED",
        winnerRegistrationId: "a",
        participants: [
          { registrationId: "a", slot: "A" },
          { registrationId: "b", slot: "B" },
        ],
      },
      {
        groupId: "g1",
        status: "SCHEDULED",
        winnerRegistrationId: null,
        participants: [
          { registrationId: "a", slot: "A" },
          { registrationId: "b", slot: "B" },
        ],
      },
    ];
    const standings = computeGroupStandings("g1", ["a", "b"], matches);
    expect(standings.every((s) => s.played === 0)).toBe(true);
  });

  it("handles a full round-robin of 4 participants", () => {
    const participants = ["a", "b", "c", "d"];
    const winners: Record<string, string> = {
      "a,b": "a",
      "a,c": "a",
      "a,d": "d",
      "b,c": "b",
      "b,d": "b",
      "c,d": "c",
    };
    const matches: StandingsMatch[] = Object.entries(winners).map(([pair, winner]) => {
      const [x, y] = pair.split(",");
      return {
        groupId: "g1",
        status: "COMPLETED",
        winnerRegistrationId: winner,
        participants: [
          { registrationId: x, slot: "A" },
          { registrationId: y, slot: "B" },
        ],
      };
    });
    const standings = computeGroupStandings("g1", participants, matches);
    expect(standings.every((s) => s.played === 3)).toBe(true);
    // a: 2 wins (b,c), 1 loss (d) = 6 points; b: 1 win(c)+1 win(d)... recompute below instead of asserting exact order drift.
    const totalWins = standings.reduce((sum, s) => sum + s.wins, 0);
    expect(totalWins).toBe(6); // one winner per match, 6 matches
  });
});

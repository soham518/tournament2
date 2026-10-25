import "dotenv/config";
import { prisma } from "../lib/prisma";

// E2E specs (bracket.spec.ts, tournament-lifecycle.spec.ts) create disposable
// tournaments named "E2E Bracket <timestamp>" / "E2E Knockout <timestamp>".
// This prefix is reserved for that purpose and never used by real tournaments,
// so it's a safe filter for bulk cleanup after repeated test runs.
const E2E_TOURNAMENT_PREFIX = "E2E ";

async function main() {
  const tournaments = await prisma.tournament.findMany({
    where: { name: { startsWith: E2E_TOURNAMENT_PREFIX } },
    select: { id: true, name: true, createdAt: true },
  });

  if (tournaments.length === 0) {
    console.log("No E2E test tournaments found.");
    return;
  }

  console.log(`Deleting ${tournaments.length} E2E test tournament(s):`);
  for (const t of tournaments) {
    console.log(`  - ${t.name} (${t.id}, created ${t.createdAt.toISOString()})`);
  }

  const { count } = await prisma.tournament.deleteMany({
    where: { id: { in: tournaments.map((t) => t.id) } },
  });

  console.log(`\nDeleted ${count} tournament(s). Related stages/matches/registrations cascaded.`);
}

main()
  .catch((error) => {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

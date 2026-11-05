import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Creates N throwaway PLAYER accounts (with a complete profile) and registers
// each one for a given tournament, mirroring registerForTournamentAction's
// own status logic (lib/actions/registration.ts) rather than hardcoding
// APPROVED, so this stays correct if run against a paid/manual-approval
// tournament too. All accounts share one fixed password so the admin can log
// in as any of them individually during E2E testing.
//
// Usage: npx tsx scripts/seed-bracket-test-registrations.ts --tournament=<slug or exact name> --count=64

const TEST_PASSWORD = "BracketTest123!";

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const { tournament: tournamentRef, count: countArg } = parseArgs();
  if (!tournamentRef) {
    throw new Error("Usage: --tournament=<slug or exact name> [--count=64]");
  }
  const count = countArg ? Number(countArg) : 64;
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("--count must be a positive integer");
  }

  const tournament = await prisma.tournament.findFirst({
    where: { OR: [{ slug: tournamentRef }, { name: tournamentRef }] },
  });
  if (!tournament) throw new Error(`No tournament found matching "${tournamentRef}"`);
  if (tournament.status !== "PUBLISHED") {
    throw new Error(`Tournament status is ${tournament.status}, must be PUBLISHED to register`);
  }

  console.log(`Seeding ${count} test registrations for "${tournament.name}" (${tournament.id})`);

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  let createdUsers = 0;
  let reusedUsers = 0;
  let registered = 0;
  const statusCounts: Record<string, number> = {};

  for (let i = 1; i <= count; i++) {
    const n = String(i).padStart(2, "0");
    const username = `bkt${n}`;
    const email = `bkt${n}@test.local`;

    let user = await prisma.user.findUnique({ where: { username } });
    if (user) {
      reusedUsers++;
    } else {
      user = await prisma.user.create({
        data: { username, email, passwordHash, role: "PLAYER" },
      });
      createdUsers++;
    }

    await prisma.playerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        sfaInGameName: `BracketTester${n}`,
        sfaPlayerId: `SFA-BKT-${n}`,
      },
      update: {},
    });

    // Mirrors registerForTournamentAction's own status derivation exactly
    // (lib/actions/registration.ts), so this produces the same result a
    // real browser registration would for this tournament's configuration.
    const activeCount = await prisma.tournamentRegistration.count({
      where: { tournamentId: tournament.id, status: { in: ["PENDING", "APPROVED", "WAITLISTED"] } },
    });
    const isFull = activeCount >= tournament.maxParticipants;
    const willWaitlist = isFull && tournament.waitlistEnabled;
    if (isFull && !tournament.waitlistEnabled) {
      console.log(`  Stopping at ${username}: tournament is full (${activeCount}/${tournament.maxParticipants})`);
      break;
    }

    const status = willWaitlist
      ? "WAITLISTED"
      : tournament.isPaid
        ? "PENDING"
        : tournament.approvalMode === "AUTOMATIC"
          ? "APPROVED"
          : "PENDING";

    const registration = await prisma.tournamentRegistration.upsert({
      where: { tournamentId_playerId: { tournamentId: tournament.id, playerId: user.id } },
      create: {
        tournamentId: tournament.id,
        playerId: user.id,
        status,
        paymentStatus: tournament.isPaid ? "PENDING" : "NOT_REQUIRED",
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
      update: {},
    });
    statusCounts[registration.status] = (statusCounts[registration.status] ?? 0) + 1;
    registered++;

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        tournamentId: tournament.id,
        action: "REGISTRATION_CREATED",
        entityType: "TournamentRegistration",
        entityId: registration.id,
      },
    });
  }

  console.log(`\nUsers: ${createdUsers} created, ${reusedUsers} reused`);
  console.log(`Registrations: ${registered} total — ${JSON.stringify(statusCounts)}`);
  console.log(`\nAll test accounts share one password: ${TEST_PASSWORD}`);
  console.log(`Usernames: bkt01 .. bkt${String(count).padStart(2, "0")} (emails: bkt01@test.local, ...)`);
}

main()
  .catch((error) => {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

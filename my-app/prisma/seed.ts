import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Fictional sample data for local development only. Run with:
//   npx tsx prisma/seed.ts
// Safe to re-run: skips creating a user/fighter/tournament if one with the
// same unique key already exists.

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

const SAMPLE_PASSWORD = "correct-horse-battery-staple";

const FIGHTERS = [
  { name: "Shadow", rarity: "LEGENDARY" as const },
  { name: "Lynx", rarity: "LEGENDARY" as const },
  { name: "Hermit", rarity: "EPIC" as const },
  { name: "Widow", rarity: "EPIC" as const },
  { name: "Butcher", rarity: "RARE" as const },
  { name: "Jet", rarity: "RARE" as const },
  { name: "Grace", rarity: "COMMON" as const },
  { name: "Hunter", rarity: "COMMON" as const },
];

const SAMPLE_PLAYERS = [
  { username: "akira_sfa", email: "akira@example.com", inGameName: "AkiraStrikes" },
  { username: "ren_fights", email: "ren@example.com", inGameName: "RenTheBlade" },
  { username: "mika_arena", email: "mika@example.com", inGameName: "MikaMystic" },
  { username: "jun_shadow", email: "jun@example.com", inGameName: "JunShadowfist" },
];

async function main() {
  console.log("Seeding fighters...");
  for (const fighter of FIGHTERS) {
    await prisma.fighter.upsert({
      where: { name: fighter.name },
      create: { name: fighter.name, rarity: fighter.rarity, isAvailable: true },
      update: {},
    });
  }

  console.log("Seeding sample players...");
  const passwordHash = await hashPassword(SAMPLE_PASSWORD);
  const players = [];
  for (const p of SAMPLE_PLAYERS) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      create: { email: p.email, username: p.username, passwordHash, role: "PLAYER" },
      update: {},
    });
    await prisma.playerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        sfaInGameName: p.inGameName,
        sfaPlayerId: `SFA-${p.username.toUpperCase()}`,
        discordId: `${p.username}#0001`,
      },
      update: {},
    });
    players.push(user);
  }

  const organizer = await prisma.user.findFirst({
    where: { role: { in: ["TOURNAMENT_ADMIN", "SUPER_ADMIN"] } },
  });
  if (!organizer) {
    console.log(
      "No admin account found — skipping sample tournaments. Run `npm run create-super-admin` first."
    );
    return;
  }

  console.log("Seeding a free 1v1 tournament...");
  const freeTournament = await prisma.tournament.upsert({
    where: { slug: "weekly-1v1-showdown" },
    create: {
      slug: "weekly-1v1-showdown",
      name: "Weekly 1v1 Showdown",
      description: "A free, open 1v1 knockout tournament. Legendary fighters prohibited.",
      organizerName: "Shadow Fight Arena Community",
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      mode: "ONE_V_ONE",
      preset: "SOLO_FIXED",
      structureType: "KNOCKOUT",
      legendaryFightersAllowed: false,
      registrationOpensAt: new Date(),
      registrationClosesAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      maxParticipants: 16,
      status: "PUBLISHED",
      publishedAt: new Date(),
      ownerId: organizer.id,
      prizePoolEnabled: true,
      prizePoolAmountPaise: 500000, // ₹5,000
      prizeFundingType: "GUARANTEED",
    },
    update: {},
  });
  await prisma.tournamentPrizeDistribution.createMany({
    data: [
      { tournamentId: freeTournament.id, position: 1, label: "1st place", valueType: "PERCENTAGE", value: 6000 },
      { tournamentId: freeTournament.id, position: 2, label: "2nd place", valueType: "PERCENTAGE", value: 3000 },
      { tournamentId: freeTournament.id, position: 3, label: "3rd place", valueType: "PERCENTAGE", value: 1000 },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding a paid 3v3 tournament...");
  const paidTournament = await prisma.tournament.upsert({
    where: { slug: "3v3-championship" },
    create: {
      slug: "3v3-championship",
      name: "3v3 Championship",
      description: "A paid 3v3 group-stage tournament. Entry fee ₹50 per player.",
      organizerName: "Shadow Fight Arena Community",
      startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      mode: "THREE_V_THREE",
      preset: "THREE_V_THREE_FIXED",
      structureType: "GROUP_THEN_KNOCKOUT",
      groupSize: 4,
      advancesPerGroup: 2,
      legendaryFightersAllowed: true,
      registrationOpensAt: new Date(),
      registrationClosesAt: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
      maxParticipants: 16,
      isPaid: true,
      entryFeePaise: 5000, // ₹50
      status: "PUBLISHED",
      publishedAt: new Date(),
      ownerId: organizer.id,
    },
    update: {},
  });
  await prisma.tournamentPaymentConfig.upsert({
    where: { tournamentId: paidTournament.id },
    create: {
      tournamentId: paidTournament.id,
      upiId: "sfa-community@upi",
      payeeName: "Shadow Fight Arena Community",
      qrCodeImageUrl: "https://example.com/sample-qr-code.png",
      instructions: "Pay the exact entry fee and submit your transaction reference.",
      transactionRefRequired: true,
    },
    update: {},
  });

  console.log(`Seed complete. Sample player login password: "${SAMPLE_PASSWORD}"`);
  console.log(`Players: ${SAMPLE_PLAYERS.map((p) => p.email).join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

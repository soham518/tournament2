import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// One-off Tournament Admin creation. There's no dedicated admin-management
// UI yet (see README "Known limitations"), so this mirrors
// create-super-admin.ts's security pattern: random password, printed once,
// never hardcoded or passed on the command line.
//
// Usage: npx tsx scripts/create-tournament-admin.ts --email=you@example.com --username=you --token=$SUPER_ADMIN_SETUP_TOKEN

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  const { email, username, token } = parseArgs();
  const expectedToken = process.env.SUPER_ADMIN_SETUP_TOKEN;

  if (!expectedToken) {
    throw new Error("SUPER_ADMIN_SETUP_TOKEN is not set in the environment.");
  }
  if (token !== expectedToken) {
    throw new Error("--token did not match SUPER_ADMIN_SETUP_TOKEN. Refusing to proceed.");
  }
  if (!email || !username) {
    throw new Error("Usage: --email=you@example.com --username=you --token=...");
  }

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existingUser) {
    throw new Error("A user with this email or username already exists.");
  }

  const password = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, username, passwordHash, role: "TOURNAMENT_ADMIN" },
  });

  console.log("Tournament Admin created:");
  console.log(`  email:    ${user.email}`);
  console.log(`  username: ${user.username}`);
  console.log(`  password: ${password}`);
  console.log("\nThis password is shown ONLY here. Log in now and consider rotating it.");
}

main()
  .catch((error) => {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

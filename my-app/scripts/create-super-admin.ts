import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

// Hashes inline rather than importing lib/auth/password.ts: that module is
// marked "server-only" so bcrypt never leaks into a client bundle, but that
// same guard throws when run outside Next's bundler (i.e. from this CLI).
function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

// One-time bootstrap for the first Super Admin. Deliberately requires:
//   1. SUPER_ADMIN_SETUP_TOKEN set in the environment, matched by --token
//      (prevents this from being run by accident, e.g. in a CI step).
//   2. No existing Super Admin (prevents silently minting extras later —
//      use the admin UI to grant further Super Admin roles instead).
// The password is never hardcoded or passed on the command line: it is
// generated here and printed once, so rotate it immediately after login.
//
// Usage: npx tsx scripts/create-super-admin.ts --email=you@example.com --username=you --token=$SUPER_ADMIN_SETUP_TOKEN

function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
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

  const existingSuperAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  if (existingSuperAdmin) {
    throw new Error(
      `A Super Admin already exists (${existingSuperAdmin.email}). Use the admin UI to grant additional Super Admins.`
    );
  }

  const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existingUser) {
    throw new Error("A user with this email or username already exists.");
  }

  const password = randomBytes(18).toString("base64url");
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, username, passwordHash, role: "SUPER_ADMIN" },
  });

  console.log("Super Admin created:");
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

import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(roles: Array<"PLAYER" | "TOURNAMENT_ADMIN" | "SUPER_ADMIN">) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

// Tournament Admins may only act on tournaments they own or have been
// granted AdminPermission on; Super Admins bypass the ownership check.
// This is the server-side authorization the spec requires beyond hiding
// admin UI — every admin server action/page must call this, not just rely
// on role checks alone.
export async function requireTournamentAdmin(tournamentId: string) {
  const user = await requireRole(["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);
  if (user.role === "SUPER_ADMIN") return user;

  const permission = await prisma.tournament.findFirst({
    where: {
      id: tournamentId,
      OR: [{ ownerId: user.id }, { adminPermissions: { some: { userId: user.id } } }],
    },
    select: { id: true },
  });

  if (!permission) redirect("/admin/tournaments");
  return user;
}

import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

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

// Any Tournament Admin or Super Admin can act on any tournament — admins
// are a shared team, not siloed per-tournament owners. `tournamentId` is
// kept in the signature (unused) so every existing call site stays
// unchanged; it's still the server-side authorization every admin server
// action/page must call, not just a role check alone.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept so every call site's argument list stays unchanged
export async function requireTournamentAdmin(_tournamentId: string) {
  return requireRole(["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);
}

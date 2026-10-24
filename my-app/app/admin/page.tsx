import { requireRole } from "@/lib/auth/guards";

export default async function AdminHomePage() {
  const user = await requireRole(["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);

  return (
    <div className="mx-auto w-full max-w-2xl py-16">
      <h1 className="mb-1 text-2xl font-semibold">Admin dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as {user.name} ({user.role})
      </p>
    </div>
  );
}

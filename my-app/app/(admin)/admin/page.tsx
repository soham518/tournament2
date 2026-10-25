import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { computeDisplayStatus } from "@/lib/tournaments/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminHomePage() {
  const user = await requireRole(["TOURNAMENT_ADMIN", "SUPER_ADMIN"]);

  const ownershipFilter =
    user.role === "SUPER_ADMIN"
      ? {}
      : { OR: [{ ownerId: user.id }, { adminPermissions: { some: { userId: user.id } } }] };

  const tournaments = await prisma.tournament.findMany({
    where: ownershipFilter,
    include: { _count: { select: { registrations: { where: { status: "APPROVED" } } } } },
  });

  const tournamentIds = tournaments.map((t) => t.id);

  const [totalRegistrations, pendingPayments, verifiedPaidRegistrations, recentAuditLogs] = await Promise.all([
    prisma.tournamentRegistration.count({ where: { tournamentId: { in: tournamentIds } } }),
    prisma.payment.count({
      where: { status: "PENDING_VERIFICATION", registration: { tournamentId: { in: tournamentIds } } },
    }),
    prisma.tournamentRegistration.count({
      where: { tournamentId: { in: tournamentIds }, paymentStatus: "VERIFIED" },
    }),
    prisma.auditLog.findMany({
      where: { tournamentId: { in: tournamentIds } },
      include: { actor: { select: { username: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const now = new Date();
  const statusCounts = { active: 0, upcoming: 0, completed: 0, cancelled: 0, draft: 0 };
  for (const t of tournaments) {
    const status = computeDisplayStatus(t, t._count.registrations, now);
    if (status === "DRAFT") statusCounts.draft++;
    else if (status === "CANCELLED") statusCounts.cancelled++;
    else if (status === "UPCOMING") statusCounts.upcoming++;
    else if (status === "COMPLETED") statusCounts.completed++;
    else statusCounts.active++;
  }

  const stats = [
    { label: "Total tournaments", value: tournaments.length },
    { label: "Active", value: statusCounts.active },
    { label: "Upcoming", value: statusCounts.upcoming },
    { label: "Completed", value: statusCounts.completed },
    { label: "Total registrations", value: totalRegistrations },
    { label: "Pending payment verification", value: pendingPayments },
    { label: "Confirmed paid registrations", value: verifiedPaidRegistrations },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-16">
      <div>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {user.name} ({user.role})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stat.value}</CardContent>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent activity</h2>
          {user.role === "SUPER_ADMIN" && (
            <Link href="/admin/audit-log" className="text-sm underline">
              View full audit log
            </Link>
          )}
        </div>
        {recentAuditLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentAuditLogs.map((log) => (
              <li key={log.id} className="text-muted-foreground">
                {log.actor?.username ?? "System"} — {log.action.replace(/_/g, " ")} —{" "}
                {log.createdAt.toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/admin/tournaments" className="inline-block text-sm underline">
        Manage tournaments →
      </Link>
    </div>
  );
}

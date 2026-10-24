import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AuditLogPage() {
  await requireRole(["SUPER_ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    include: {
      actor: { select: { username: true } },
      tournament: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 py-16">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <p className="text-sm text-muted-foreground">Most recent 200 platform-wide actions.</p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Tournament</TableHead>
            <TableHead>Entity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-sm">{log.createdAt.toLocaleString()}</TableCell>
              <TableCell>{log.actor?.username ?? "System"}</TableCell>
              <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
              <TableCell>{log.tournament?.name ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs">
                {log.entityType}:{log.entityId.slice(0, 8)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

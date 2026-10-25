import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  UswTable,
  UswTableBody,
  UswTableCell,
  UswTableHead,
  UswTableHeader,
  UswTableRow,
} from "@/components/usw/table";

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
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
        Audit log
      </h1>
      <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
        Most recent 200 platform-wide actions.
      </p>

      <UswTable>
        <UswTableHeader>
          <UswTableRow>
            <UswTableHead>When</UswTableHead>
            <UswTableHead>Actor</UswTableHead>
            <UswTableHead>Action</UswTableHead>
            <UswTableHead>Tournament</UswTableHead>
            <UswTableHead>Entity</UswTableHead>
          </UswTableRow>
        </UswTableHeader>
        <UswTableBody>
          {logs.map((log) => (
            <UswTableRow key={log.id}>
              <UswTableCell className="whitespace-nowrap text-sm">{log.createdAt.toLocaleString()}</UswTableCell>
              <UswTableCell>{log.actor?.username ?? "System"}</UswTableCell>
              <UswTableCell>{log.action.replace(/_/g, " ")}</UswTableCell>
              <UswTableCell>{log.tournament?.name ?? "—"}</UswTableCell>
              <UswTableCell className="text-xs">
                {log.entityType}:{log.entityId.slice(0, 8)}
              </UswTableCell>
            </UswTableRow>
          ))}
        </UswTableBody>
      </UswTable>
    </div>
  );
}

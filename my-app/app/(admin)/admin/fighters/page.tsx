import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { UswButton } from "@/components/usw/button";
import { UswBadge } from "@/components/usw/badge";
import {
  UswTable,
  UswTableBody,
  UswTableCell,
  UswTableHead,
  UswTableHeader,
  UswTableRow,
} from "@/components/usw/table";
import { FighterFormDialog } from "./fighter-form-dialog";
import { AvailabilityToggle } from "./availability-toggle";

const RARITY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  COMMON: "outline",
  RARE: "secondary",
  EPIC: "secondary",
  LEGENDARY: "default",
};

export default async function FightersPage() {
  await requireRole(["SUPER_ADMIN"]);
  const fighters = await prisma.fighter.findMany({ orderBy: [{ rarity: "desc" }, { name: "asc" }] });

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="font-[family-name:var(--font-space-mono)] text-[11px] font-bold uppercase tracking-widest text-[var(--usw-secondary-fixed-dim)]">
            [Roster Registry]
          </span>
          <h1 className="font-[family-name:var(--font-space-grotesk)] mt-1 text-2xl font-bold uppercase text-[var(--usw-on-surface)]">
            Fighter catalog
          </h1>
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
            Manage the Shadow Fight Arena fighter roster available to tournament organizers.
          </p>
        </div>
        <FighterFormDialog trigger={<UswButton>Add fighter</UswButton>} />
      </div>

      {fighters.length === 0 ? (
        <p className="font-[family-name:var(--font-space-mono)] text-sm text-[var(--usw-on-surface-variant)]">
          No fighters yet. Add the first one above.
        </p>
      ) : (
        <UswTable>
          <UswTableHeader>
            <UswTableRow>
              <UswTableHead>Name</UswTableHead>
              <UswTableHead>Rarity</UswTableHead>
              <UswTableHead>Available</UswTableHead>
              <UswTableHead className="text-right">Actions</UswTableHead>
            </UswTableRow>
          </UswTableHeader>
          <UswTableBody>
            {fighters.map((fighter) => (
              <UswTableRow key={fighter.id}>
                <UswTableCell className="font-bold">{fighter.name}</UswTableCell>
                <UswTableCell>
                  <UswBadge variant={RARITY_VARIANT[fighter.rarity]}>{fighter.rarity}</UswBadge>
                </UswTableCell>
                <UswTableCell>
                  <AvailabilityToggle id={fighter.id} isAvailable={fighter.isAvailable} />
                </UswTableCell>
                <UswTableCell className="text-right">
                  <FighterFormDialog
                    trigger={
                      <UswButton variant="ghost" size="sm">
                        Edit
                      </UswButton>
                    }
                    fighter={{
                      id: fighter.id,
                      name: fighter.name,
                      rarity: fighter.rarity,
                      isAvailable: fighter.isAvailable,
                      description: fighter.description ?? "",
                      portraitImageUrl: fighter.portraitImageUrl ?? "",
                    }}
                  />
                </UswTableCell>
              </UswTableRow>
            ))}
          </UswTableBody>
        </UswTable>
      )}
    </div>
  );
}

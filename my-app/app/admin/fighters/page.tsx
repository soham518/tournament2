import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
    <div className="mx-auto w-full max-w-4xl py-16">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Fighter catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage the Shadow Fight Arena fighter roster available to tournament organizers.
          </p>
        </div>
        <FighterFormDialog trigger={<Button>Add fighter</Button>} />
      </div>

      {fighters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No fighters yet. Add the first one above.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rarity</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fighters.map((fighter) => (
              <TableRow key={fighter.id}>
                <TableCell className="font-medium">{fighter.name}</TableCell>
                <TableCell>
                  <Badge variant={RARITY_VARIANT[fighter.rarity]}>{fighter.rarity}</Badge>
                </TableCell>
                <TableCell>
                  <AvailabilityToggle id={fighter.id} isAvailable={fighter.isAvailable} />
                </TableCell>
                <TableCell className="text-right">
                  <FighterFormDialog
                    trigger={
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

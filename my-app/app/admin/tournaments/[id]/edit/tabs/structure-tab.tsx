"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateStructureAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StructureFormValues = {
  structureType: "KNOCKOUT" | "GROUP" | "GROUP_THEN_KNOCKOUT";
  seedingMethod: "MANUAL" | "RANDOM";
  hasThirdPlaceMatch: boolean;
  groupSize: number | "";
  advancesPerGroup: number | "";
};

export function StructureTab({
  tournamentId,
  defaults,
}: {
  tournamentId: string;
  defaults: StructureFormValues;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<StructureFormValues>({ defaultValues: defaults });
  const structureType = watch("structureType");
  const hasGroups = structureType === "GROUP" || structureType === "GROUP_THEN_KNOCKOUT";
  const hasKnockout = structureType === "KNOCKOUT" || structureType === "GROUP_THEN_KNOCKOUT";

  async function onSubmit(values: StructureFormValues) {
    setServerError(null);
    setSaved(false);
    // valueAsNumber on an empty input yields NaN, not "" — normalize both.
    const orUndefined = (n: number | "") => (n === "" || Number.isNaN(n) ? undefined : n);
    const result = await updateStructureAction(tournamentId, {
      ...values,
      groupSize: orUndefined(values.groupSize),
      advancesPerGroup: orUndefined(values.advancesPerGroup),
    });
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="structureType">Tournament structure</Label>
        <Controller
          name="structureType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="structureType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KNOCKOUT">Single-elimination knockout</SelectItem>
                <SelectItem value="GROUP">Group stage</SelectItem>
                <SelectItem value="GROUP_THEN_KNOCKOUT">Group stage + knockout playoffs</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {hasGroups && (
        <div className="grid grid-cols-2 gap-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="groupSize">Group size</Label>
            <Input id="groupSize" type="number" min={2} {...register("groupSize", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advancesPerGroup">Advances per group (if followed by knockout)</Label>
            <Input
              id="advancesPerGroup"
              type="number"
              min={1}
              {...register("advancesPerGroup", { valueAsNumber: true })}
            />
          </div>
        </div>
      )}

      {hasKnockout && (
        <div className="space-y-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="seedingMethod">Seeding method</Label>
            <Controller
              name="seedingMethod"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="seedingMethod" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RANDOM">Random</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="hasThirdPlaceMatch">Play a third-place match</Label>
            <Controller
              name="hasThirdPlaceMatch"
              control={control}
              render={({ field }) => (
                <Switch
                  id="hasThirdPlaceMatch"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      )}

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

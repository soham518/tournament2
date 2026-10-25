"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateStructureAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswSwitch } from "@/components/usw/switch";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import { UswFieldSuccess } from "@/components/usw/field-success";

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
        <UswLabel htmlFor="structureType">Tournament structure</UswLabel>
        <UswSelect id="structureType" {...register("structureType")}>
          <option value="KNOCKOUT">Single-elimination knockout</option>
          <option value="GROUP">Group stage</option>
          <option value="GROUP_THEN_KNOCKOUT">Group stage + knockout playoffs</option>
        </UswSelect>
      </div>

      {hasGroups && (
        <div className="grid grid-cols-2 gap-4 bg-[var(--usw-surface-container-low)] p-3">
          <div className="space-y-2">
            <UswLabel htmlFor="groupSize">Group size</UswLabel>
            <UswInput id="groupSize" type="number" min={2} {...register("groupSize", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="advancesPerGroup">Advances per group (if followed by knockout)</UswLabel>
            <UswInput
              id="advancesPerGroup"
              type="number"
              min={1}
              {...register("advancesPerGroup", { valueAsNumber: true })}
            />
          </div>
        </div>
      )}

      {hasKnockout && (
        <div className="space-y-4 bg-[var(--usw-surface-container-low)] p-3">
          <div className="space-y-2">
            <UswLabel htmlFor="seedingMethod">Seeding method</UswLabel>
            <UswSelect id="seedingMethod" {...register("seedingMethod")}>
              <option value="RANDOM">Random</option>
              <option value="MANUAL">Manual</option>
            </UswSelect>
          </div>
          <div className="flex items-center justify-between">
            <UswLabel htmlFor="hasThirdPlaceMatch">Play a third-place match</UswLabel>
            <Controller
              name="hasThirdPlaceMatch"
              control={control}
              render={({ field }) => (
                <UswSwitch
                  id="hasThirdPlaceMatch"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      )}

      <UswFieldError>{serverError}</UswFieldError>
      <UswFieldSuccess>{saved && "Saved."}</UswFieldSuccess>
      <UswButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </UswButton>
    </form>
  );
}

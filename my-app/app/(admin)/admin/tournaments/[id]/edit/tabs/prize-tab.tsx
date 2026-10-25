"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { updatePrizePoolAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswSwitch } from "@/components/usw/switch";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import { UswFieldSuccess } from "@/components/usw/field-success";

type DistributionRow = {
  position: number;
  label: string;
  valueType: "FIXED" | "PERCENTAGE";
  valueInput: string;
};

type PrizeFormValues = {
  prizePoolEnabled: boolean;
  prizePoolAmountRupees: string;
  prizeFundingType: "GUARANTEED" | "REGISTRATION_DEPENDENT";
  prizeRevenuePercent: string;
  distributions: DistributionRow[];
};

const DEFAULT_DISTRIBUTIONS: DistributionRow[] = [
  { position: 1, label: "1st place", valueType: "PERCENTAGE", valueInput: "60" },
  { position: 2, label: "2nd place", valueType: "PERCENTAGE", valueInput: "30" },
  { position: 3, label: "3rd place", valueType: "PERCENTAGE", valueInput: "10" },
];

export function PrizeTab({
  tournamentId,
  defaults,
}: {
  tournamentId: string;
  defaults: PrizeFormValues;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<PrizeFormValues>({
    defaultValues: {
      ...defaults,
      distributions: defaults.distributions.length > 0 ? defaults.distributions : DEFAULT_DISTRIBUTIONS,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "distributions" });
  const prizePoolEnabled = watch("prizePoolEnabled");
  const prizeFundingType = watch("prizeFundingType");

  async function onSubmit(values: PrizeFormValues) {
    setServerError(null);
    setSaved(false);
    const result = await updatePrizePoolAction(tournamentId, {
      prizePoolEnabled: values.prizePoolEnabled,
      prizePoolAmountPaise: Math.round(Number(values.prizePoolAmountRupees || "0") * 100),
      prizeFundingType: values.prizeFundingType,
      prizeRevenuePercent: values.prizeRevenuePercent ? Number(values.prizeRevenuePercent) : undefined,
      // Percentage input "60" -> 6000 basis points; rupee input "500" -> 50000 paise.
      // Both are the same *100 conversion, just different units of the same input field.
      distributions: values.distributions.map((d) => ({
        position: d.position,
        label: d.label,
        valueType: d.valueType,
        value: Math.round(Number(d.valueInput || "0") * 100),
      })),
    });
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between">
        <UswLabel htmlFor="prizePoolEnabled">Prize pool enabled</UswLabel>
        <Controller
          name="prizePoolEnabled"
          control={control}
          render={({ field }) => (
            <UswSwitch id="prizePoolEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {prizePoolEnabled && (
        <div className="space-y-4 bg-[var(--usw-surface-container-low)] p-3">
          <div className="space-y-2">
            <UswLabel htmlFor="prizeFundingType">Funding type</UswLabel>
            <UswSelect id="prizeFundingType" {...register("prizeFundingType")}>
              <option value="GUARANTEED">Guaranteed amount</option>
              <option value="REGISTRATION_DEPENDENT">Based on collected entry fees</option>
            </UswSelect>
          </div>
          {prizeFundingType === "GUARANTEED" ? (
            <div className="space-y-2">
              <UswLabel htmlFor="prizePoolAmountRupees">Total prize pool (INR)</UswLabel>
              <UswInput
                id="prizePoolAmountRupees"
                type="number"
                min={0}
                step="0.01"
                {...register("prizePoolAmountRupees")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <UswLabel htmlFor="prizeRevenuePercent">
                Percent of verified entry fees allocated to the prize pool
              </UswLabel>
              <UswInput
                id="prizeRevenuePercent"
                type="number"
                min={0}
                max={100}
                {...register("prizeRevenuePercent")}
              />
            </div>
          )}

          <div className="space-y-2">
            <UswLabel>Prize distribution</UswLabel>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
                <UswInput placeholder="Label" {...register(`distributions.${index}.label`)} />
                <UswSelect {...register(`distributions.${index}.valueType`)}>
                  <option value="PERCENTAGE">%</option>
                  <option value="FIXED">INR</option>
                </UswSelect>
                <UswInput
                  type="number"
                  min={0}
                  className="w-24"
                  {...register(`distributions.${index}.valueInput`)}
                />
                <UswButton type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  Remove
                </UswButton>
              </div>
            ))}
            <UswButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  position: fields.length + 1,
                  label: `${fields.length + 1}th place`,
                  valueType: "PERCENTAGE",
                  valueInput: "0",
                })
              }
            >
              Add position
            </UswButton>
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

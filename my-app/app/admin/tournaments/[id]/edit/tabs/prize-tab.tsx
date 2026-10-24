"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { updatePrizePoolAction } from "@/lib/actions/tournament";
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
        <Label htmlFor="prizePoolEnabled">Prize pool enabled</Label>
        <Controller
          name="prizePoolEnabled"
          control={control}
          render={({ field }) => (
            <Switch id="prizePoolEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {prizePoolEnabled && (
        <div className="space-y-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="prizeFundingType">Funding type</Label>
            <Controller
              name="prizeFundingType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="prizeFundingType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GUARANTEED">Guaranteed amount</SelectItem>
                    <SelectItem value="REGISTRATION_DEPENDENT">
                      Based on collected entry fees
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {prizeFundingType === "GUARANTEED" ? (
            <div className="space-y-2">
              <Label htmlFor="prizePoolAmountRupees">Total prize pool (INR)</Label>
              <Input
                id="prizePoolAmountRupees"
                type="number"
                min={0}
                step="0.01"
                {...register("prizePoolAmountRupees")}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="prizeRevenuePercent">
                Percent of verified entry fees allocated to the prize pool
              </Label>
              <Input
                id="prizeRevenuePercent"
                type="number"
                min={0}
                max={100}
                {...register("prizeRevenuePercent")}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Prize distribution</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] items-end gap-2">
                <Input placeholder="Label" {...register(`distributions.${index}.label`)} />
                <Controller
                  name={`distributions.${index}.valueType`}
                  control={control}
                  render={({ field: f }) => (
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">%</SelectItem>
                        <SelectItem value="FIXED">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input
                  type="number"
                  min={0}
                  className="w-24"
                  {...register(`distributions.${index}.valueInput`)}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
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
            </Button>
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

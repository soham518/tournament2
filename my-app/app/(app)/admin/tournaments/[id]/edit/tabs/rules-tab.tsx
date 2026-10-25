"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateRulesAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type RulesFormValues = {
  legendaryFightersAllowed: boolean;
  minAccountLevel: number | "";
  eligibilityNotes: string;
  levelRuleEnabled: boolean;
  levelRuleDescription: string;
  levelRuleRequiresVerification: boolean;
  rosterMinLevel: number | "";
  rosterLevelAppliesToAllFighters: boolean;
  allowedFighterIds: string[];
};

type Fighter = { id: string; name: string; rarity: string; isAvailable: boolean };

export function RulesTab({
  tournamentId,
  mode,
  defaults,
  fighters,
}: {
  tournamentId: string;
  mode: "ONE_V_ONE" | "THREE_V_THREE";
  defaults: RulesFormValues;
  fighters: Fighter[];
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<RulesFormValues>({ defaultValues: defaults });
  const levelRuleEnabled = watch("levelRuleEnabled");
  const legendaryAllowed = watch("legendaryFightersAllowed");

  async function onSubmit(values: RulesFormValues) {
    setServerError(null);
    setSaved(false);
    // valueAsNumber on an empty input yields NaN, not "" — normalize both.
    const orUndefined = (n: number | "") => (n === "" || Number.isNaN(n) ? undefined : n);
    const result = await updateRulesAction(tournamentId, {
      ...values,
      minAccountLevel: orUndefined(values.minAccountLevel),
      rosterMinLevel: orUndefined(values.rosterMinLevel),
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
        <Label htmlFor="legendaryFightersAllowed">Legendary fighters allowed</Label>
        <Controller
          name="legendaryFightersAllowed"
          control={control}
          render={({ field }) => (
            <Switch
              id="legendaryFightersAllowed"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
      {!legendaryAllowed && (
        <p className="text-xs text-muted-foreground">
          Legendary-rarity fighters will be excluded from selection below, regardless of the
          allow-list.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="minAccountLevel">Minimum account level (optional)</Label>
        <Input
          id="minAccountLevel"
          type="number"
          min={1}
          {...register("minAccountLevel", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="eligibilityNotes">Other eligibility requirements (optional)</Label>
        <Textarea id="eligibilityNotes" rows={2} {...register("eligibilityNotes")} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="levelRuleEnabled">
          {mode === "ONE_V_ONE" ? "Require equal fighter level" : "Enforce roster level rule"}
        </Label>
        <Controller
          name="levelRuleEnabled"
          control={control}
          render={({ field }) => (
            <Switch id="levelRuleEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      {levelRuleEnabled && (
        <div className="space-y-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="levelRuleDescription">
              Describe the level-equivalence rule (shown in published rules)
            </Label>
            <Textarea id="levelRuleDescription" rows={2} {...register("levelRuleDescription")} />
          </div>
          {mode === "THREE_V_THREE" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rosterMinLevel">Minimum fighter/roster level</Label>
                <Input
                  id="rosterMinLevel"
                  type="number"
                  min={1}
                  {...register("rosterMinLevel", { valueAsNumber: true })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  name="rosterLevelAppliesToAllFighters"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="rosterLevelAppliesToAllFighters"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="rosterLevelAppliesToAllFighters">
                  Applies to every fighter in the roster, not just one
                </Label>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Controller
              name="levelRuleRequiresVerification"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="levelRuleRequiresVerification"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="levelRuleRequiresVerification">Requires manual admin verification</Label>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Allowed fighters</Label>
        <p className="text-xs text-muted-foreground">
          Leave all unchecked to allow every fighter permitted by the legendary-rarity rule above.
        </p>
        <Controller
          name="allowedFighterIds"
          control={control}
          render={({ field }) => (
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-md border p-3">
              {fighters
                .filter((f) => legendaryAllowed || f.rarity !== "LEGENDARY")
                .map((fighter) => (
                  <label key={fighter.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value.includes(fighter.id)}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked
                            ? [...field.value, fighter.id]
                            : field.value.filter((id) => id !== fighter.id)
                        );
                      }}
                    />
                    {fighter.name} ({fighter.rarity})
                  </label>
                ))}
            </div>
          )}
        />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

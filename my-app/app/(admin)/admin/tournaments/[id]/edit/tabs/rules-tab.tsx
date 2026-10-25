"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateRulesAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswTextarea } from "@/components/usw/textarea";
import { UswSwitch } from "@/components/usw/switch";
import { UswCheckbox } from "@/components/usw/checkbox";
import { UswFieldError } from "@/components/usw/field-error";
import { UswFieldSuccess } from "@/components/usw/field-success";

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
        <UswLabel htmlFor="legendaryFightersAllowed">Legendary fighters allowed</UswLabel>
        <Controller
          name="legendaryFightersAllowed"
          control={control}
          render={({ field }) => (
            <UswSwitch
              id="legendaryFightersAllowed"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>
      {!legendaryAllowed && (
        <p className="font-[family-name:var(--font-space-mono)] text-xs text-[var(--usw-on-surface-variant)]">
          Legendary-rarity fighters will be excluded from selection below, regardless of the
          allow-list.
        </p>
      )}

      <div className="space-y-2">
        <UswLabel htmlFor="minAccountLevel">Minimum account level (optional)</UswLabel>
        <UswInput
          id="minAccountLevel"
          type="number"
          min={1}
          {...register("minAccountLevel", { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="eligibilityNotes">Other eligibility requirements (optional)</UswLabel>
        <UswTextarea id="eligibilityNotes" rows={2} {...register("eligibilityNotes")} />
      </div>

      <div className="flex items-center justify-between">
        <UswLabel htmlFor="levelRuleEnabled">
          {mode === "ONE_V_ONE" ? "Require equal fighter level" : "Enforce roster level rule"}
        </UswLabel>
        <Controller
          name="levelRuleEnabled"
          control={control}
          render={({ field }) => (
            <UswSwitch id="levelRuleEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      {levelRuleEnabled && (
        <div className="space-y-4 bg-[var(--usw-surface-container-low)] p-3">
          <div className="space-y-2">
            <UswLabel htmlFor="levelRuleDescription">
              Describe the level-equivalence rule (shown in published rules)
            </UswLabel>
            <UswTextarea id="levelRuleDescription" rows={2} {...register("levelRuleDescription")} />
          </div>
          {mode === "THREE_V_THREE" && (
            <>
              <div className="space-y-2">
                <UswLabel htmlFor="rosterMinLevel">Minimum fighter/roster level</UswLabel>
                <UswInput
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
                    <UswCheckbox
                      id="rosterLevelAppliesToAllFighters"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <UswLabel htmlFor="rosterLevelAppliesToAllFighters">
                  Applies to every fighter in the roster, not just one
                </UswLabel>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <Controller
              name="levelRuleRequiresVerification"
              control={control}
              render={({ field }) => (
                <UswCheckbox
                  id="levelRuleRequiresVerification"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <UswLabel htmlFor="levelRuleRequiresVerification">Requires manual admin verification</UswLabel>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <UswLabel>Allowed fighters</UswLabel>
        <p className="font-[family-name:var(--font-space-mono)] text-xs text-[var(--usw-on-surface-variant)]">
          Leave all unchecked to allow every fighter permitted by the legendary-rarity rule above.
        </p>
        <Controller
          name="allowedFighterIds"
          control={control}
          render={({ field }) => (
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto bg-[var(--usw-surface-container-low)] p-3">
              {fighters
                .filter((f) => legendaryAllowed || f.rarity !== "LEGENDARY")
                .map((fighter) => (
                  <label
                    key={fighter.id}
                    className="font-[family-name:var(--font-space-mono)] flex items-center gap-2 text-sm text-[var(--usw-on-surface)]"
                  >
                    <UswCheckbox
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

      <UswFieldError>{serverError}</UswFieldError>
      <UswFieldSuccess>{saved && "Saved."}</UswFieldSuccess>
      <UswButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </UswButton>
    </form>
  );
}

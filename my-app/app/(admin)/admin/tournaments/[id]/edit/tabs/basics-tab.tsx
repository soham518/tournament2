"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { updateBasicsAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswTextarea } from "@/components/usw/textarea";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import { UswFieldSuccess } from "@/components/usw/field-success";

// Dates are kept as plain datetime-local strings on the client; the server
// action's Zod schema (z.coerce.date()) does the real parsing/validation.
// Decoupling avoids RHF/Zod friction between a coerced schema's string
// input type and Date output type.
type BasicsFormValues = {
  name: string;
  description: string;
  coverImageUrl: string;
  organizerName: string;
  startAt: string;
  endAt: string;
  timezone: string;
  contactInfo: string;
  instructions: string;
  mode: "ONE_V_ONE" | "THREE_V_THREE";
  preset: "SOLO_FIXED" | "SOLO_FLEXIBLE" | "THREE_V_THREE_FIXED" | "THREE_V_THREE_FLEXIBLE";
};

const PRESETS_BY_MODE: Record<BasicsFormValues["mode"], BasicsFormValues["preset"][]> = {
  ONE_V_ONE: ["SOLO_FIXED", "SOLO_FLEXIBLE"],
  THREE_V_THREE: ["THREE_V_THREE_FIXED", "THREE_V_THREE_FLEXIBLE"],
};

export function BasicsTab({
  tournamentId,
  defaults,
}: {
  tournamentId: string;
  defaults: BasicsFormValues;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<BasicsFormValues>({ defaultValues: defaults });
  const mode = watch("mode");

  async function onSubmit(values: BasicsFormValues) {
    setServerError(null);
    setSaved(false);
    const result = await updateBasicsAction(tournamentId, {
      ...values,
      // An empty string would coerce to an Invalid Date rather than "not set".
      endAt: values.endAt || undefined,
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
        <UswLabel htmlFor="name">Tournament name</UswLabel>
        <UswInput id="name" {...register("name", { required: true })} />
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="description">Description</UswLabel>
        <UswTextarea id="description" rows={4} {...register("description", { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <UswLabel htmlFor="mode">Competition mode</UswLabel>
          <UswSelect id="mode" {...register("mode")}>
            <option value="ONE_V_ONE">1v1</option>
            <option value="THREE_V_THREE">3v3</option>
          </UswSelect>
        </div>
        <div className="space-y-2">
          <UswLabel htmlFor="preset">Preset</UswLabel>
          <UswSelect id="preset" {...register("preset")}>
            {PRESETS_BY_MODE[mode].map((preset) => (
              <option key={preset} value={preset}>
                {preset.replace(/_/g, " ")}
              </option>
            ))}
          </UswSelect>
        </div>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="organizerName">Organizer</UswLabel>
        <UswInput id="organizerName" {...register("organizerName", { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <UswLabel htmlFor="startAt">Start date &amp; time</UswLabel>
          <UswInput id="startAt" type="datetime-local" {...register("startAt", { required: true })} />
        </div>
        <div className="space-y-2">
          <UswLabel htmlFor="endAt">End date &amp; time (optional)</UswLabel>
          <UswInput id="endAt" type="datetime-local" {...register("endAt")} />
        </div>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="timezone">Time zone</UswLabel>
        <UswInput id="timezone" {...register("timezone", { required: true })} />
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="coverImageUrl">Cover image URL (optional)</UswLabel>
        <UswInput id="coverImageUrl" {...register("coverImageUrl")} />
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="contactInfo">Contact information (optional)</UswLabel>
        <UswInput id="contactInfo" {...register("contactInfo")} />
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="instructions">Additional instructions (optional)</UswLabel>
        <UswTextarea id="instructions" rows={3} {...register("instructions")} />
      </div>
      <UswFieldError>{serverError}</UswFieldError>
      <UswFieldSuccess>{saved && "Saved."}</UswFieldSuccess>
      <UswButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </UswButton>
    </form>
  );
}

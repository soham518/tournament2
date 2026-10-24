"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateBasicsAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    control,
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
        <Label htmlFor="name">Tournament name</Label>
        <Input id="name" {...register("name", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...register("description", { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mode">Competition mode</Label>
          <Controller
            name="mode"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONE_V_ONE">1v1</SelectItem>
                  <SelectItem value="THREE_V_THREE">3v3</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="preset">Preset</Label>
          <Controller
            name="preset"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="preset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS_BY_MODE[mode].map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {preset.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizerName">Organizer</Label>
        <Input id="organizerName" {...register("organizerName", { required: true })} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startAt">Start date &amp; time</Label>
          <Input id="startAt" type="datetime-local" {...register("startAt", { required: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAt">End date &amp; time (optional)</Label>
          <Input id="endAt" type="datetime-local" {...register("endAt")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Time zone</Label>
        <Input id="timezone" {...register("timezone", { required: true })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="coverImageUrl">Cover image URL (optional)</Label>
        <Input id="coverImageUrl" {...register("coverImageUrl")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactInfo">Contact information (optional)</Label>
        <Input id="contactInfo" {...register("contactInfo")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="instructions">Additional instructions (optional)</Label>
        <Textarea id="instructions" rows={3} {...register("instructions")} />
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

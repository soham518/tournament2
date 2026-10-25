"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createDraftTournamentAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import {
  UswDialog,
  UswDialogContent,
  UswDialogHeader,
  UswDialogTitle,
  UswDialogTrigger,
} from "@/components/usw/dialog";

type FormValues = {
  name: string;
  mode: "ONE_V_ONE" | "THREE_V_THREE";
  preset: "SOLO_FIXED" | "SOLO_FLEXIBLE" | "THREE_V_THREE_FIXED" | "THREE_V_THREE_FLEXIBLE";
  structureType: "KNOCKOUT" | "GROUP" | "GROUP_THEN_KNOCKOUT";
  startAt: string;
  maxParticipants: number;
};

const PRESETS_BY_MODE: Record<FormValues["mode"], FormValues["preset"][]> = {
  ONE_V_ONE: ["SOLO_FIXED", "SOLO_FLEXIBLE"],
  THREE_V_THREE: ["THREE_V_THREE_FIXED", "THREE_V_THREE_FLEXIBLE"],
};

export function CreateTournamentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      mode: "ONE_V_ONE",
      preset: "SOLO_FIXED",
      structureType: "KNOCKOUT",
      maxParticipants: 16,
    },
  });
  const mode = watch("mode");

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const result = await createDraftTournamentAction({
      ...values,
      maxParticipants: Number(values.maxParticipants),
    });
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setOpen(false);
    router.push(`/admin/tournaments/${result.id}/edit`);
  }

  return (
    <UswDialog open={open} onOpenChange={setOpen}>
      <UswDialogTrigger render={<UswButton>Create tournament</UswButton>} />
      <UswDialogContent>
        <UswDialogHeader>
          <UswDialogTitle>Create tournament</UswDialogTitle>
        </UswDialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <UswLabel htmlFor="name">Name</UswLabel>
            <UswInput id="name" {...register("name", { required: true })} />
          </div>
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
          <div className="space-y-2">
            <UswLabel htmlFor="structureType">Structure</UswLabel>
            <UswSelect id="structureType" {...register("structureType")}>
              <option value="KNOCKOUT">Single-elimination knockout</option>
              <option value="GROUP">Group stage</option>
              <option value="GROUP_THEN_KNOCKOUT">Group stage + knockout playoffs</option>
            </UswSelect>
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="startAt">Start date &amp; time</UswLabel>
            <UswInput id="startAt" type="datetime-local" {...register("startAt", { required: true })} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="maxParticipants">Max participants</UswLabel>
            <UswInput id="maxParticipants" type="number" min={2} {...register("maxParticipants", { required: true })} />
          </div>
          <UswFieldError>{serverError}</UswFieldError>
          <UswButton type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create draft"}
          </UswButton>
        </form>
      </UswDialogContent>
    </UswDialog>
  );
}

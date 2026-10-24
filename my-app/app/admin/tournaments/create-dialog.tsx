"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { createDraftTournamentAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  const { register, handleSubmit, control, watch, formState: { isSubmitting } } = useForm<FormValues>({
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>Create tournament</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create tournament</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="structureType">Structure</Label>
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
          <div className="space-y-2">
            <Label htmlFor="startAt">Start date &amp; time</Label>
            <Input id="startAt" type="datetime-local" {...register("startAt", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max participants</Label>
            <Input id="maxParticipants" type="number" min={2} {...register("maxParticipants", { required: true })} />
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create draft"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

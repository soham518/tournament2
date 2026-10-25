"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fighterSchema, type FighterInput } from "@/lib/validations/fighter";
import { createFighterAction, updateFighterAction } from "@/lib/actions/fighter";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswTextarea } from "@/components/usw/textarea";
import { UswSwitch } from "@/components/usw/switch";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import {
  UswDialog,
  UswDialogContent,
  UswDialogHeader,
  UswDialogTitle,
  UswDialogTrigger,
} from "@/components/usw/dialog";

type FighterFormDialogProps = {
  trigger: React.ReactElement;
  fighter?: { id: string } & FighterInput;
};

export function FighterFormDialog({ trigger, fighter }: FighterFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FighterInput>({
    resolver: zodResolver(fighterSchema),
    defaultValues: fighter ?? { name: "", rarity: "COMMON", isAvailable: true, description: "", portraitImageUrl: "" },
  });

  async function onSubmit(values: FighterInput) {
    setServerError(null);
    const result = fighter
      ? await updateFighterAction(fighter.id, values)
      : await createFighterAction(values);
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setOpen(false);
    if (!fighter) reset();
  }

  return (
    <UswDialog open={open} onOpenChange={setOpen}>
      <UswDialogTrigger render={trigger} />
      <UswDialogContent>
        <UswDialogHeader>
          <UswDialogTitle>{fighter ? "Edit fighter" : "Add fighter"}</UswDialogTitle>
        </UswDialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <UswLabel htmlFor="name">Name</UswLabel>
            <UswInput id="name" {...register("name")} />
            <UswFieldError>{errors.name?.message}</UswFieldError>
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="rarity">Rarity</UswLabel>
            <UswSelect id="rarity" {...register("rarity")}>
              <option value="COMMON">Common</option>
              <option value="RARE">Rare</option>
              <option value="EPIC">Epic</option>
              <option value="LEGENDARY">Legendary</option>
            </UswSelect>
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="portraitImageUrl">Portrait image URL (optional)</UswLabel>
            <UswInput id="portraitImageUrl" {...register("portraitImageUrl")} />
            <UswFieldError>{errors.portraitImageUrl?.message}</UswFieldError>
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="description">Description (optional)</UswLabel>
            <UswTextarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="flex items-center justify-between">
            <UswLabel htmlFor="isAvailable">Available for selection</UswLabel>
            <Controller
              name="isAvailable"
              control={control}
              render={({ field }) => (
                <UswSwitch id="isAvailable" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          <UswFieldError>{serverError}</UswFieldError>
          <UswButton type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : fighter ? "Save changes" : "Add fighter"}
          </UswButton>
        </form>
      </UswDialogContent>
    </UswDialog>
  );
}

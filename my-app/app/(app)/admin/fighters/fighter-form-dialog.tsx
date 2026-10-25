"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fighterSchema, type FighterInput } from "@/lib/validations/fighter";
import { createFighterAction, updateFighterAction } from "@/lib/actions/fighter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fighter ? "Edit fighter" : "Add fighter"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rarity">Rarity</Label>
            <Controller
              name="rarity"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="rarity" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMMON">Common</SelectItem>
                    <SelectItem value="RARE">Rare</SelectItem>
                    <SelectItem value="EPIC">Epic</SelectItem>
                    <SelectItem value="LEGENDARY">Legendary</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portraitImageUrl">Portrait image URL (optional)</Label>
            <Input id="portraitImageUrl" {...register("portraitImageUrl")} />
            {errors.portraitImageUrl && (
              <p className="text-sm text-destructive">{errors.portraitImageUrl.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isAvailable">Available for selection</Label>
            <Controller
              name="isAvailable"
              control={control}
              render={({ field }) => (
                <Switch id="isAvailable" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : fighter ? "Save changes" : "Add fighter"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { completeProfileSchema, type CompleteProfileInput } from "@/lib/validations/profile";
import { completeProfileAction } from "@/lib/actions/profile";
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

export function OnboardingForm({ defaultValues }: { defaultValues?: Partial<CompleteProfileInput> }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { platform: undefined, ...defaultValues },
  });

  async function onSubmit(values: CompleteProfileInput) {
    setServerError(null);
    // On success completeProfileAction redirects server-side and never returns.
    const result = await completeProfileAction(values);
    setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sfaInGameName">Shadow Fight Arena in-game name</Label>
        <Input id="sfaInGameName" {...register("sfaInGameName")} />
        {errors.sfaInGameName && (
          <p className="text-sm text-destructive">{errors.sfaInGameName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sfaPlayerId">Shadow Fight Arena player ID</Label>
        <Input id="sfaPlayerId" {...register("sfaPlayerId")} />
        {errors.sfaPlayerId && (
          <p className="text-sm text-destructive">{errors.sfaPlayerId.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="discordId">Discord ID</Label>
        <Input id="discordId" {...register("discordId")} />
        {errors.discordId && (
          <p className="text-sm text-destructive">{errors.discordId.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Controller
          name="platform"
          control={control}
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger id="platform" className="w-full">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOBILE">Mobile</SelectItem>
                <SelectItem value="PC">PC</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (optional)</Label>
        <Textarea id="bio" rows={3} {...register("bio")} />
        {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}

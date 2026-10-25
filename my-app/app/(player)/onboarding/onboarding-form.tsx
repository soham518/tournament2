"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import {
  completeProfileSchema,
  type CompleteProfileFormValues,
} from "@/lib/validations/profile";
import { completeProfileAction } from "@/lib/actions/profile";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswTextarea } from "@/components/usw/textarea";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";

export function OnboardingForm({
  defaultValues,
}: {
  defaultValues?: Partial<CompleteProfileFormValues>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { platform: "", ...defaultValues },
  });

  async function onSubmit(values: CompleteProfileFormValues) {
    setServerError(null);
    // On success completeProfileAction redirects server-side and never returns.
    const result = await completeProfileAction(values);
    setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <UswLabel htmlFor="sfaInGameName">Shadow Fight Arena in-game name</UswLabel>
        <UswInput id="sfaInGameName" {...register("sfaInGameName")} />
        <UswFieldError>{errors.sfaInGameName?.message}</UswFieldError>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="sfaPlayerId">Shadow Fight Arena player ID</UswLabel>
        <UswInput id="sfaPlayerId" {...register("sfaPlayerId")} />
        <UswFieldError>{errors.sfaPlayerId?.message}</UswFieldError>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="discordId">Discord ID</UswLabel>
        <UswInput id="discordId" {...register("discordId")} />
        <UswFieldError>{errors.discordId?.message}</UswFieldError>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="platform">Platform</UswLabel>
        <UswSelect id="platform" {...register("platform")} defaultValue="">
          <option value="" disabled>
            Select a platform
          </option>
          <option value="MOBILE">Mobile</option>
          <option value="PC">PC</option>
          <option value="OTHER">Other</option>
        </UswSelect>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="bio">Bio (optional)</UswLabel>
        <UswTextarea id="bio" rows={3} {...register("bio")} />
        <UswFieldError>{errors.bio?.message}</UswFieldError>
      </div>
      <UswFieldError>{serverError}</UswFieldError>
      <UswButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save and continue"}
      </UswButton>
    </form>
  );
}

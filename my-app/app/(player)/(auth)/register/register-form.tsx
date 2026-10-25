"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/lib/actions/auth";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswFieldError } from "@/components/usw/field-error";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    // On success registerAction redirects server-side and never returns.
    const result = await registerAction(values);
    setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <UswLabel htmlFor="username">Username</UswLabel>
        <UswInput id="username" autoComplete="username" {...register("username")} />
        <UswFieldError>{errors.username?.message}</UswFieldError>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="email">Email</UswLabel>
        <UswInput id="email" type="email" autoComplete="email" {...register("email")} />
        <UswFieldError>{errors.email?.message}</UswFieldError>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="password">Password</UswLabel>
        <UswInput
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        <UswFieldError>{errors.password?.message}</UswFieldError>
      </div>
      <UswFieldError>{serverError}</UswFieldError>
      <UswButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </UswButton>
    </form>
  );
}

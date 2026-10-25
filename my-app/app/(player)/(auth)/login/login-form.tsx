"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/lib/actions/auth";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswFieldError } from "@/components/usw/field-error";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    // On success loginAction redirects server-side and never returns.
    const result = await loginAction(values);
    setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          autoComplete="current-password"
          {...register("password")}
        />
        <UswFieldError>{errors.password?.message}</UswFieldError>
      </div>
      <UswFieldError>{serverError}</UswFieldError>
      <UswButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </UswButton>
    </form>
  );
}

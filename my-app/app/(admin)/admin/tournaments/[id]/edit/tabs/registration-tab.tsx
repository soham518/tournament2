"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateRegistrationSettingsAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswSwitch } from "@/components/usw/switch";
import { UswSelect } from "@/components/usw/select";
import { UswFieldError } from "@/components/usw/field-error";
import { UswFieldSuccess } from "@/components/usw/field-success";

type RegistrationFormValues = {
  registrationOpensAt: string;
  registrationClosesAt: string;
  maxParticipants: number;
  minParticipants: number | "";
  waitlistEnabled: boolean;
  approvalMode: "AUTOMATIC" | "MANUAL";
  paymentDeadlineMinutes: number | "";
  checkInEnabled: boolean;
  checkInOpensBeforeMinutes: number | "";
};

export function RegistrationTab({
  tournamentId,
  defaults,
}: {
  tournamentId: string;
  defaults: RegistrationFormValues;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<RegistrationFormValues>({ defaultValues: defaults });
  const waitlistEnabled = watch("waitlistEnabled");
  const checkInEnabled = watch("checkInEnabled");

  async function onSubmit(values: RegistrationFormValues) {
    setServerError(null);
    setSaved(false);
    // valueAsNumber on an empty input yields NaN, not "" — normalize both.
    const orUndefined = (n: number | "") => (n === "" || Number.isNaN(n) ? undefined : n);
    const result = await updateRegistrationSettingsAction(tournamentId, {
      ...values,
      minParticipants: orUndefined(values.minParticipants),
      paymentDeadlineMinutes: orUndefined(values.paymentDeadlineMinutes),
      checkInOpensBeforeMinutes: orUndefined(values.checkInOpensBeforeMinutes),
    });
    if (!result.success) {
      setServerError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <UswLabel htmlFor="registrationOpensAt">Registration opens</UswLabel>
          <UswInput
            id="registrationOpensAt"
            type="datetime-local"
            {...register("registrationOpensAt", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <UswLabel htmlFor="registrationClosesAt">Registration closes</UswLabel>
          <UswInput
            id="registrationClosesAt"
            type="datetime-local"
            {...register("registrationClosesAt", { required: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <UswLabel htmlFor="maxParticipants">Max participants</UswLabel>
          <UswInput
            id="maxParticipants"
            type="number"
            min={2}
            {...register("maxParticipants", { required: true, valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <UswLabel htmlFor="minParticipants">Min participants (optional)</UswLabel>
          <UswInput
            id="minParticipants"
            type="number"
            min={1}
            {...register("minParticipants", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <UswLabel htmlFor="waitlistEnabled">Enable waitlist</UswLabel>
        <Controller
          name="waitlistEnabled"
          control={control}
          render={({ field }) => (
            <UswSwitch id="waitlistEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      {waitlistEnabled && (
        <p className="font-[family-name:var(--font-space-mono)] text-xs text-[var(--usw-on-surface-variant)]">
          Players register past capacity onto a waitlist and are promoted automatically if a slot
          frees up.
        </p>
      )}
      <div className="space-y-2">
        <UswLabel htmlFor="approvalMode">Registration approval</UswLabel>
        <UswSelect id="approvalMode" {...register("approvalMode")}>
          <option value="AUTOMATIC">Automatic</option>
          <option value="MANUAL">Manual review required</option>
        </UswSelect>
      </div>
      <div className="space-y-2">
        <UswLabel htmlFor="paymentDeadlineMinutes">
          Payment deadline after registering, in minutes (optional)
        </UswLabel>
        <UswInput
          id="paymentDeadlineMinutes"
          type="number"
          min={1}
          {...register("paymentDeadlineMinutes", { valueAsNumber: true })}
        />
      </div>
      <div className="flex items-center justify-between">
        <UswLabel htmlFor="checkInEnabled">Require check-in</UswLabel>
        <Controller
          name="checkInEnabled"
          control={control}
          render={({ field }) => (
            <UswSwitch id="checkInEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      {checkInEnabled && (
        <div className="space-y-2">
          <UswLabel htmlFor="checkInOpensBeforeMinutes">Check-in opens this many minutes before start</UswLabel>
          <UswInput
            id="checkInOpensBeforeMinutes"
            type="number"
            min={1}
            {...register("checkInOpensBeforeMinutes", { valueAsNumber: true })}
          />
        </div>
      )}
      <UswFieldError>{serverError}</UswFieldError>
      <UswFieldSuccess>{saved && "Saved."}</UswFieldSuccess>
      <UswButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </UswButton>
    </form>
  );
}

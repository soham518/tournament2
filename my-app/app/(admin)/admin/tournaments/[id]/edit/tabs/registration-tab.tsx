"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updateRegistrationSettingsAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
          <Label htmlFor="registrationOpensAt">Registration opens</Label>
          <Input
            id="registrationOpensAt"
            type="datetime-local"
            {...register("registrationOpensAt", { required: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationClosesAt">Registration closes</Label>
          <Input
            id="registrationClosesAt"
            type="datetime-local"
            {...register("registrationClosesAt", { required: true })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="maxParticipants">Max participants</Label>
          <Input
            id="maxParticipants"
            type="number"
            min={2}
            {...register("maxParticipants", { required: true, valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minParticipants">Min participants (optional)</Label>
          <Input
            id="minParticipants"
            type="number"
            min={1}
            {...register("minParticipants", { valueAsNumber: true })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="waitlistEnabled">Enable waitlist</Label>
        <Controller
          name="waitlistEnabled"
          control={control}
          render={({ field }) => (
            <Switch id="waitlistEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      {waitlistEnabled && (
        <p className="text-xs text-muted-foreground">
          Players register past capacity onto a waitlist and are promoted automatically if a slot
          frees up.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="approvalMode">Registration approval</Label>
        <Controller
          name="approvalMode"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="approvalMode" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                <SelectItem value="MANUAL">Manual review required</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentDeadlineMinutes">
          Payment deadline after registering, in minutes (optional)
        </Label>
        <Input
          id="paymentDeadlineMinutes"
          type="number"
          min={1}
          {...register("paymentDeadlineMinutes", { valueAsNumber: true })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="checkInEnabled">Require check-in</Label>
        <Controller
          name="checkInEnabled"
          control={control}
          render={({ field }) => (
            <Switch id="checkInEnabled" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      {checkInEnabled && (
        <div className="space-y-2">
          <Label htmlFor="checkInOpensBeforeMinutes">Check-in opens this many minutes before start</Label>
          <Input
            id="checkInOpensBeforeMinutes"
            type="number"
            min={1}
            {...register("checkInOpensBeforeMinutes", { valueAsNumber: true })}
          />
        </div>
      )}
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

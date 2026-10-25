"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updatePaymentConfigAction } from "@/lib/actions/tournament";
import { UswButton } from "@/components/usw/button";
import { UswInput } from "@/components/usw/input";
import { UswLabel } from "@/components/usw/label";
import { UswTextarea } from "@/components/usw/textarea";
import { UswSwitch } from "@/components/usw/switch";
import { UswFieldError } from "@/components/usw/field-error";
import { UswFieldSuccess } from "@/components/usw/field-success";

type PaymentFormValues = {
  isPaid: boolean;
  entryFeeRupees: string;
  upiId: string;
  payeeName: string;
  qrCodeImageUrl: string;
  instructions: string;
  submissionDeadlineAt: string;
  transactionRefRequired: boolean;
  screenshotDiscordUrl: string;
  refundPolicy: string;
};

export function PaymentTab({
  tournamentId,
  defaults,
}: {
  tournamentId: string;
  defaults: PaymentFormValues;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm<PaymentFormValues>({ defaultValues: defaults });
  const isPaid = watch("isPaid");

  async function submit(values: PaymentFormValues, confirmed: boolean) {
    setServerError(null);
    setSaved(false);
    const result = await updatePaymentConfigAction(
      tournamentId,
      {
        isPaid: values.isPaid,
        entryFeePaise: Math.round(Number(values.entryFeeRupees || "0") * 100),
        upiId: values.upiId,
        payeeName: values.payeeName,
        qrCodeImageUrl: values.qrCodeImageUrl,
        instructions: values.instructions,
        submissionDeadlineAt: values.submissionDeadlineAt || undefined,
        transactionRefRequired: values.transactionRefRequired,
        screenshotDiscordUrl: values.screenshotDiscordUrl,
        refundPolicy: values.refundPolicy,
      },
      confirmed
    );
    if (!result.success) {
      if (result.error.includes("requires explicit confirmation")) {
        setNeedsConfirm(true);
      }
      setServerError(result.error);
      return;
    }
    setNeedsConfirm(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit((values) => submit(values, false))} className="space-y-4">
      <div className="flex items-center justify-between">
        <UswLabel htmlFor="isPaid">Paid registration</UswLabel>
        <Controller
          name="isPaid"
          control={control}
          render={({ field }) => (
            <UswSwitch id="isPaid" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {isPaid && (
        <div className="space-y-4 bg-[var(--usw-surface-container-low)] p-3">
          <div className="space-y-2">
            <UswLabel htmlFor="entryFeeRupees">Entry fee (INR)</UswLabel>
            <UswInput id="entryFeeRupees" type="number" min={0} step="0.01" {...register("entryFeeRupees")} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="upiId">UPI ID</UswLabel>
            <UswInput id="upiId" {...register("upiId", { required: isPaid })} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="payeeName">Payee name</UswLabel>
            <UswInput id="payeeName" {...register("payeeName", { required: isPaid })} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="qrCodeImageUrl">QR code image URL</UswLabel>
            <UswInput id="qrCodeImageUrl" {...register("qrCodeImageUrl", { required: isPaid })} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="instructions">Payment instructions (optional)</UswLabel>
            <UswTextarea id="instructions" rows={2} {...register("instructions")} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="submissionDeadlineAt">Payment submission deadline (optional)</UswLabel>
            <UswInput id="submissionDeadlineAt" type="datetime-local" {...register("submissionDeadlineAt")} />
          </div>
          <div className="flex items-center justify-between">
            <UswLabel htmlFor="transactionRefRequired">Require transaction reference / UTR</UswLabel>
            <Controller
              name="transactionRefRequired"
              control={control}
              render={({ field }) => (
                <UswSwitch
                  id="transactionRefRequired"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="screenshotDiscordUrl">
              Discord link for players to share payment screenshots (optional)
            </UswLabel>
            <UswInput id="screenshotDiscordUrl" {...register("screenshotDiscordUrl")} />
          </div>
          <div className="space-y-2">
            <UswLabel htmlFor="refundPolicy">Cancellation &amp; refund policy (optional)</UswLabel>
            <UswTextarea id="refundPolicy" rows={2} {...register("refundPolicy")} />
          </div>
        </div>
      )}

      {serverError && (
        <div className="space-y-2">
          <UswFieldError>{serverError}</UswFieldError>
          {needsConfirm && (
            <UswButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubmit((values) => submit(values, true))}
            >
              Confirm change anyway
            </UswButton>
          )}
        </div>
      )}
      <UswFieldSuccess>{saved && "Saved."}</UswFieldSuccess>
      <UswButton type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </UswButton>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { updatePaymentConfigAction } from "@/lib/actions/tournament";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
        <Label htmlFor="isPaid">Paid registration</Label>
        <Controller
          name="isPaid"
          control={control}
          render={({ field }) => (
            <Switch id="isPaid" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      {isPaid && (
        <div className="space-y-4 rounded-md border p-3">
          <div className="space-y-2">
            <Label htmlFor="entryFeeRupees">Entry fee (INR)</Label>
            <Input id="entryFeeRupees" type="number" min={0} step="0.01" {...register("entryFeeRupees")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="upiId">UPI ID</Label>
            <Input id="upiId" {...register("upiId", { required: isPaid })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payeeName">Payee name</Label>
            <Input id="payeeName" {...register("payeeName", { required: isPaid })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qrCodeImageUrl">QR code image URL</Label>
            <Input id="qrCodeImageUrl" {...register("qrCodeImageUrl", { required: isPaid })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Payment instructions (optional)</Label>
            <Textarea id="instructions" rows={2} {...register("instructions")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="submissionDeadlineAt">Payment submission deadline (optional)</Label>
            <Input id="submissionDeadlineAt" type="datetime-local" {...register("submissionDeadlineAt")} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="transactionRefRequired">Require transaction reference / UTR</Label>
            <Controller
              name="transactionRefRequired"
              control={control}
              render={({ field }) => (
                <Switch
                  id="transactionRefRequired"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="screenshotDiscordUrl">
              Discord link for players to share payment screenshots (optional)
            </Label>
            <Input id="screenshotDiscordUrl" {...register("screenshotDiscordUrl")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refundPolicy">Cancellation &amp; refund policy (optional)</Label>
            <Textarea id="refundPolicy" rows={2} {...register("refundPolicy")} />
          </div>
        </div>
      )}

      {serverError && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">{serverError}</p>
          {needsConfirm && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSubmit((values) => submit(values, true))}
            >
              Confirm change anyway
            </Button>
          )}
        </div>
      )}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

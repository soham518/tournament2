"use client";

import { useState } from "react";
import { UswButton } from "@/components/usw/button";

export function CopyUpiButton({ upiId }: { upiId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <UswButton
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied!" : "Copy UPI ID"}
    </UswButton>
  );
}

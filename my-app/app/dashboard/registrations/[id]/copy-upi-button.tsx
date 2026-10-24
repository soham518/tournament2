"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyUpiButton({ upiId }: { upiId: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "Copied!" : "Copy UPI ID"}
    </Button>
  );
}

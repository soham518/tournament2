"use client";

import { useEffect, useState } from "react";

function split(msRemaining: number) {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    mins: Math.floor((totalSeconds % 3600) / 60),
    secs: totalSeconds % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  // Starts null so the server-rendered and first client-rendered HTML are
  // identical (both show "--"); the real value is filled in after mount,
  // avoiding a hydration mismatch from the inherent clock drift between
  // when the server rendered and when the client hydrates.
  const [remaining, setRemaining] = useState<ReturnType<typeof split> | null>(null);

  useEffect(() => {
    setRemaining(split(targetMs - Date.now()));
    const interval = setInterval(() => setRemaining(split(targetMs - Date.now())), 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  const cells = [
    { label: "Days", value: remaining?.days },
    { label: "Hours", value: remaining?.hours },
    { label: "Mins", value: remaining?.mins },
    { label: "Secs", value: remaining?.secs },
  ];

  return (
    <div className="grid grid-cols-4 gap-1 bg-[var(--usw-surface-container-low)] p-2">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col items-center justify-center bg-[var(--usw-surface-container-lowest)] py-2"
        >
          <span className="font-[family-name:var(--font-space-grotesk)] text-2xl leading-none font-bold text-[var(--usw-primary)]">
            {cell.value === undefined ? "--" : pad(cell.value)}
          </span>
          <span className="font-[family-name:var(--font-space-mono)] mt-1 text-[9px] uppercase text-[var(--usw-on-surface-variant)]">
            {cell.label}
          </span>
        </div>
      ))}
    </div>
  );
}

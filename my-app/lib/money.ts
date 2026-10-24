export function paiseToRupees(paise: number | null | undefined) {
  return ((paise ?? 0) / 100).toString();
}

export function rupeesToPaise(rupees: string | number | undefined) {
  if (rupees === undefined || rupees === "") return 0;
  return Math.round(Number(rupees) * 100);
}

export function formatPaiseAsInr(paise: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    (paise ?? 0) / 100
  );
}

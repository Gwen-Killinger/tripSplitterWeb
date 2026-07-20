export function formatCurrency(
  amountCents: number,
  currencyCode = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amountCents / 100);
}

export function parseCurrencyToCents(value: string): number | null {
  const normalizedValue = value.replace(/[$,\s]/g, "");

  if (!/^\d+(\.\d{0,2})?$/.test(normalizedValue)) {
    return null;
  }

  const amount = Number(normalizedValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return Math.round(amount * 100);
}
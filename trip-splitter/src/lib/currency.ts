export function formatCurrency(
  amountCents: number,
  currencyCode = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amountCents / 100);
}
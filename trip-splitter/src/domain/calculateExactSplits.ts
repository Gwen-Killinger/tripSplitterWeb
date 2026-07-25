import type { ExpenseSplit } from "./models";

export function calculateExactSplits(
  amountCents: number,
  entries: ExpenseSplit[],
): ExpenseSplit[] {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Amount must be a positive integer.");
  }

  const memberIds = entries.map((entry) => entry.memberId);

  if (new Set(memberIds).size !== memberIds.length) {
    throw new Error("Member IDs must be unique.");
  }

  if (
    entries.some(
      (entry) =>
        !Number.isInteger(entry.shareCents) ||
        entry.shareCents < 0,
    )
  ) {
    throw new Error(
      "Exact amounts must be nonnegative integers.",
    );
  }

  const positiveEntries = entries.filter(
    (entry) => entry.shareCents > 0,
  );

  if (positiveEntries.length === 0) {
    throw new Error(
      "At least one exact amount must be positive.",
    );
  }

  const totalCents = positiveEntries.reduce(
    (total, entry) => total + entry.shareCents,
    0,
  );

  if (totalCents !== amountCents) {
    throw new Error(
      "Exact amounts must total the expense amount.",
    );
  }

  return positiveEntries.map(({ memberId, shareCents }) => ({
    memberId,
    shareCents,
  }));
}

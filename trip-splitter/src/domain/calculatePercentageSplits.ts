import type { ExpenseSplit } from "./models";

export type PercentageSplitInput = {
  memberId: string;
  percentageBasisPoints: number;
};

export function calculatePercentageSplits(
  amountCents: number,
  entries: PercentageSplitInput[],
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
        !Number.isInteger(entry.percentageBasisPoints) ||
        entry.percentageBasisPoints < 0,
    )
  ) {
    throw new Error(
      "Percentages must be nonnegative integers.",
    );
  }

  const positiveEntries = entries.filter(
    (entry) => entry.percentageBasisPoints > 0,
  );

  if (positiveEntries.length === 0) {
    throw new Error(
      "At least one percentage must be positive.",
    );
  }

  const totalBasisPoints = positiveEntries.reduce(
    (total, entry) => total + entry.percentageBasisPoints,
    0,
  );

  if (totalBasisPoints !== 10000) {
    throw new Error("Percentages must total exactly 100%.");
  }

  const allocations = positiveEntries.map((entry, index) => {
    const numerator =
      amountCents * entry.percentageBasisPoints;

    return {
      ...entry,
      index,
      shareCents: Math.floor(numerator / 10000),
      remainder: numerator % 10000,
    };
  });

  const remainingCents =
    amountCents -
    allocations.reduce(
      (total, allocation) =>
        total + allocation.shareCents,
      0,
    );

  const remainderOrder = [...allocations].sort(
    (first, second) =>
      second.remainder - first.remainder ||
      first.index - second.index,
  );

  for (let index = 0; index < remainingCents; index++) {
    remainderOrder[index].shareCents += 1;
  }

  return allocations.map(
    ({
      memberId,
      percentageBasisPoints,
      shareCents,
    }) => ({
      memberId,
      shareCents,
      percentageBasisPoints,
    }),
  );
}

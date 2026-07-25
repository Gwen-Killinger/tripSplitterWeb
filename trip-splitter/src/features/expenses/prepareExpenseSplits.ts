import { calculateEqualSplits } from "../../domain/calculateEqualSplits";
import { calculateExactSplits } from "../../domain/calculateExactSplits";
import { calculatePercentageSplits } from "../../domain/calculatePercentageSplits";
import type {
  ExpenseSplit,
  ExpenseSplitMode,
  TripMember,
} from "../../domain/models";
import {
  formatBasisPointsForInput,
  parseCurrencyToCents,
  parseNonnegativeCurrencyToCents,
  parsePercentageToBasisPoints,
} from "../../lib/currency";

type PrepareExpenseSplitsInput = {
  splitMode: ExpenseSplitMode;
  amount: string;
  members: TripMember[];
  participantMemberIds: string[];
  exactAmounts: Record<string, string>;
  percentages: Record<string, string>;
};

export type PreparedExpenseSplits = {
  amountCents: number | null;
  participantMemberIds: string[];
  splits: ExpenseSplit[] | null;
  splitError: string | null;
  exactTotalCents: number | null;
  percentageTotalBasisPoints: number | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Enter a valid split.";
}

export function prepareExpenseSplits({
  splitMode,
  amount,
  members,
  participantMemberIds,
  exactAmounts,
  percentages,
}: PrepareExpenseSplitsInput): PreparedExpenseSplits {
  const amountCents = parseCurrencyToCents(amount);

  if (splitMode === "equal") {
    if (amountCents === null) {
      return {
        amountCents,
        participantMemberIds,
        splits: null,
        splitError: null,
        exactTotalCents: null,
        percentageTotalBasisPoints: null,
      };
    }

    try {
      return {
        amountCents,
        participantMemberIds,
        splits: calculateEqualSplits(
          amountCents,
          participantMemberIds,
        ),
        splitError: null,
        exactTotalCents: null,
        percentageTotalBasisPoints: null,
      };
    } catch (error) {
      return {
        amountCents,
        participantMemberIds,
        splits: null,
        splitError: getErrorMessage(error),
        exactTotalCents: null,
        percentageTotalBasisPoints: null,
      };
    }
  }

  if (splitMode === "exact") {
    const entries = members.map((member) => ({
      memberId: member.id,
      shareCents:
        exactAmounts[member.id]?.trim() === ""
          ? 0
          : parseNonnegativeCurrencyToCents(
              exactAmounts[member.id] ?? "",
            ),
    }));

    const hasInvalidEntry = entries.some(
      (entry) => entry.shareCents === null,
    );
    const exactTotalCents = hasInvalidEntry
      ? null
      : entries.reduce(
          (total, entry) => total + (entry.shareCents ?? 0),
          0,
        );
    const positiveMemberIds = entries
      .filter(
        (entry) =>
          entry.shareCents !== null &&
          entry.shareCents > 0,
      )
      .map((entry) => entry.memberId);

    if (amountCents === null || hasInvalidEntry) {
      return {
        amountCents,
        participantMemberIds: positiveMemberIds,
        splits: null,
        splitError: hasInvalidEntry
          ? "Enter valid nonnegative exact amounts."
          : null,
        exactTotalCents,
        percentageTotalBasisPoints: null,
      };
    }

    try {
      const splits = calculateExactSplits(
        amountCents,
        entries.map((entry) => ({
          memberId: entry.memberId,
          shareCents: entry.shareCents ?? 0,
        })),
      );

      return {
        amountCents,
        participantMemberIds: splits.map(
          (split) => split.memberId,
        ),
        splits,
        splitError: null,
        exactTotalCents,
        percentageTotalBasisPoints: null,
      };
    } catch (error) {
      return {
        amountCents,
        participantMemberIds: positiveMemberIds,
        splits: null,
        splitError: getErrorMessage(error),
        exactTotalCents,
        percentageTotalBasisPoints: null,
      };
    }
  }

  const entries = members.map((member) => ({
    memberId: member.id,
    percentageBasisPoints:
      percentages[member.id]?.trim() === ""
        ? 0
        : parsePercentageToBasisPoints(
            percentages[member.id] ?? "",
          ),
  }));
  const hasInvalidEntry = entries.some(
    (entry) => entry.percentageBasisPoints === null,
  );
  const percentageTotalBasisPoints = hasInvalidEntry
    ? null
    : entries.reduce(
        (total, entry) =>
          total + (entry.percentageBasisPoints ?? 0),
        0,
      );
  const positiveMemberIds = entries
    .filter(
      (entry) =>
        entry.percentageBasisPoints !== null &&
        entry.percentageBasisPoints > 0,
    )
    .map((entry) => entry.memberId);

  if (amountCents === null || hasInvalidEntry) {
    return {
      amountCents,
      participantMemberIds: positiveMemberIds,
      splits: null,
      splitError: hasInvalidEntry
        ? "Enter valid nonnegative percentages."
        : null,
      exactTotalCents: null,
      percentageTotalBasisPoints,
    };
  }

  try {
    const splits = calculatePercentageSplits(
      amountCents,
      entries.map((entry) => ({
        memberId: entry.memberId,
        percentageBasisPoints:
          entry.percentageBasisPoints ?? 0,
      })),
    );

    return {
      amountCents,
      participantMemberIds: splits.map(
        (split) => split.memberId,
      ),
      splits,
      splitError: null,
      exactTotalCents: null,
      percentageTotalBasisPoints,
    };
  } catch (error) {
    return {
      amountCents,
      participantMemberIds: positiveMemberIds,
      splits: null,
      splitError: getErrorMessage(error),
      exactTotalCents: null,
      percentageTotalBasisPoints,
    };
  }
}

export function createSplitModeDefaults(
  splitMode: "exact" | "percentage",
  amount: string,
  participantMemberIds: string[],
): Record<string, string> {
  if (participantMemberIds.length === 0) {
    return {};
  }

  if (splitMode === "percentage") {
    return Object.fromEntries(
      calculateEqualSplits(
        10000,
        participantMemberIds,
      ).map((split) => [
        split.memberId,
        formatBasisPointsForInput(split.shareCents),
      ]),
    );
  }

  const amountCents = parseCurrencyToCents(amount);

  if (amountCents === null) {
    return {};
  }

  return Object.fromEntries(
    calculateEqualSplits(
      amountCents,
      participantMemberIds,
    ).map((split) => [
      split.memberId,
      (split.shareCents / 100).toFixed(2),
    ]),
  );
}

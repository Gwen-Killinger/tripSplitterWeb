import { describe, expect, it } from "vitest";
import { createSplitModeDefaults, prepareExpenseSplits } from "./prepareExpenseSplits";

const members = [
  { id: "a", displayName: "A" },
  { id: "b", displayName: "B" },
  { id: "c", displayName: "C" },
];

const baseInput = {
  amount: "10.00",
  members,
  participantMemberIds: ["a", "b", "c"],
  exactAmounts: {},
  percentages: {},
};

describe("prepareExpenseSplits", () => {
  it("prepares equal canonical splits", () => {
    const result = prepareExpenseSplits({
      ...baseInput,
      splitMode: "equal",
    });

    expect(result.splits?.map((split) => split.shareCents)).toEqual([
      334,
      333,
      333,
    ]);
  });

  it("prepares exact splits and excludes zeros", () => {
    const result = prepareExpenseSplits({
      ...baseInput,
      splitMode: "exact",
      exactAmounts: {
        a: "7.00",
        b: "3.00",
        c: "0",
      },
    });

    expect(result.participantMemberIds).toEqual(["a", "b"]);
    expect(result.exactTotalCents).toBe(1000);
    expect(result.splits).toEqual([
      { memberId: "a", shareCents: 700 },
      { memberId: "b", shareCents: 300 },
    ]);
  });

  it("prepares percentage splits with retained basis points", () => {
    const result = prepareExpenseSplits({
      ...baseInput,
      splitMode: "percentage",
      percentages: {
        a: "50",
        b: "25",
        c: "25",
      },
    });

    expect(result.percentageTotalBasisPoints).toBe(10000);
    expect(result.splits?.map((split) => split.shareCents)).toEqual([
      500,
      250,
      250,
    ]);
    expect(
      result.splits?.map(
        (split) => split.percentageBasisPoints,
      ),
    ).toEqual([5000, 2500, 2500]);
  });

  it("creates deterministic defaults", () => {
    expect(
      createSplitModeDefaults(
        "exact",
        "10.00",
        ["a", "b", "c"],
      ),
    ).toEqual({
      a: "3.34",
      b: "3.33",
      c: "3.33",
    });
    expect(
      createSplitModeDefaults(
        "percentage",
        "10.00",
        ["a", "b", "c"],
      ),
    ).toEqual({
      a: "33.34",
      b: "33.33",
      c: "33.33",
    });
  });
});

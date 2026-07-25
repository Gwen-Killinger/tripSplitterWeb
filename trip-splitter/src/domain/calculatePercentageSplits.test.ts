import { describe, expect, it } from "vitest";
import { calculatePercentageSplits } from "./calculatePercentageSplits";

describe("calculatePercentageSplits", () => {
  it("allocates 50%, 25%, and 25%", () => {
    expect(
      calculatePercentageSplits(1000, [
        { memberId: "a", percentageBasisPoints: 5000 },
        { memberId: "b", percentageBasisPoints: 2500 },
        { memberId: "c", percentageBasisPoints: 2500 },
      ]),
    ).toEqual([
      {
        memberId: "a",
        shareCents: 500,
        percentageBasisPoints: 5000,
      },
      {
        memberId: "b",
        shareCents: 250,
        percentageBasisPoints: 2500,
      },
      {
        memberId: "c",
        shareCents: 250,
        percentageBasisPoints: 2500,
      },
    ]);
  });

  it("assigns rounding cents by remainder then input order", () => {
    expect(
      calculatePercentageSplits(1, [
        { memberId: "a", percentageBasisPoints: 3334 },
        { memberId: "b", percentageBasisPoints: 3333 },
        { memberId: "c", percentageBasisPoints: 3333 },
      ]).map((split) => split.shareCents),
    ).toEqual([1, 0, 0]);

    expect(
      calculatePercentageSplits(2, [
        { memberId: "a", percentageBasisPoints: 5000 },
        { memberId: "b", percentageBasisPoints: 2500 },
        { memberId: "c", percentageBasisPoints: 2500 },
      ]).map((split) => split.shareCents),
    ).toEqual([1, 1, 0]);
  });

  it("filters zero percentages and always allocates the total", () => {
    const splits = calculatePercentageSplits(845, [
      { memberId: "a", percentageBasisPoints: 6000 },
      { memberId: "b", percentageBasisPoints: 4000 },
      { memberId: "c", percentageBasisPoints: 0 },
    ]);

    expect(splits.map((split) => split.memberId)).toEqual([
      "a",
      "b",
    ]);
    expect(
      splits.reduce(
        (total, split) => total + split.shareCents,
        0,
      ),
    ).toBe(845);
  });

  it("rejects invalid percentage entries and totals", () => {
    expect(() =>
      calculatePercentageSplits(100, [
        { memberId: "a", percentageBasisPoints: 0 },
      ]),
    ).toThrow("At least one percentage must be positive.");
    expect(() =>
      calculatePercentageSplits(100, [
        { memberId: "a", percentageBasisPoints: -1 },
      ]),
    ).toThrow("Percentages must be nonnegative integers.");
    expect(() =>
      calculatePercentageSplits(100, [
        { memberId: "a", percentageBasisPoints: 9999 },
      ]),
    ).toThrow("Percentages must total exactly 100%.");
    expect(() =>
      calculatePercentageSplits(100, [
        { memberId: "a", percentageBasisPoints: 10001 },
      ]),
    ).toThrow("Percentages must total exactly 100%.");
    expect(() =>
      calculatePercentageSplits(100, [
        { memberId: "a", percentageBasisPoints: 5000 },
        { memberId: "a", percentageBasisPoints: 5000 },
      ]),
    ).toThrow("Member IDs must be unique.");
  });

  it("does not mutate its input", () => {
    const entries = [
      { memberId: "a", percentageBasisPoints: 5000 },
      { memberId: "b", percentageBasisPoints: 5000 },
    ];
    const original = structuredClone(entries);

    calculatePercentageSplits(100, entries);

    expect(entries).toEqual(original);
  });
});

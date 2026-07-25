import { describe, expect, it } from "vitest";
import { calculateExactSplits } from "./calculateExactSplits";

describe("calculateExactSplits", () => {
  it("returns positive exact amounts totaling the expense", () => {
    expect(
      calculateExactSplits(1000, [
        { memberId: "a", shareCents: 500 },
        { memberId: "b", shareCents: 300 },
        { memberId: "c", shareCents: 200 },
      ]),
    ).toEqual([
      { memberId: "a", shareCents: 500 },
      { memberId: "b", shareCents: 300 },
      { memberId: "c", shareCents: 200 },
    ]);
  });

  it("excludes zero-value members", () => {
    expect(
      calculateExactSplits(100, [
        { memberId: "a", shareCents: 100 },
        { memberId: "b", shareCents: 0 },
      ]),
    ).toEqual([{ memberId: "a", shareCents: 100 }]);
  });

  it("rejects all-zero, negative, noninteger, and duplicate entries", () => {
    expect(() =>
      calculateExactSplits(100, [
        { memberId: "a", shareCents: 0 },
      ]),
    ).toThrow("At least one exact amount must be positive.");
    expect(() =>
      calculateExactSplits(100, [
        { memberId: "a", shareCents: -1 },
      ]),
    ).toThrow("Exact amounts must be nonnegative integers.");
    expect(() =>
      calculateExactSplits(100, [
        { memberId: "a", shareCents: 12.5 },
      ]),
    ).toThrow("Exact amounts must be nonnegative integers.");
    expect(() =>
      calculateExactSplits(100, [
        { memberId: "a", shareCents: 50 },
        { memberId: "a", shareCents: 50 },
      ]),
    ).toThrow("Member IDs must be unique.");
  });

  it("rejects totals above or below the expense amount", () => {
    expect(() =>
      calculateExactSplits(100, [
        { memberId: "a", shareCents: 99 },
      ]),
    ).toThrow("Exact amounts must total the expense amount.");
    expect(() =>
      calculateExactSplits(100, [
        { memberId: "a", shareCents: 101 },
      ]),
    ).toThrow("Exact amounts must total the expense amount.");
  });

  it("does not mutate its input", () => {
    const entries = [
      { memberId: "a", shareCents: 50 },
      { memberId: "b", shareCents: 50 },
    ];
    const original = structuredClone(entries);

    calculateExactSplits(100, entries);

    expect(entries).toEqual(original);
  });
});

import { describe, expect, it } from "vitest";
import {
  formatBasisPointsForInput,
  parseNonnegativeCurrencyToCents,
  parsePercentageToBasisPoints,
} from "./currency";

describe("custom split input parsing", () => {
  it("parses nonnegative currency using two decimals", () => {
    expect(parseNonnegativeCurrencyToCents("0")).toBe(0);
    expect(parseNonnegativeCurrencyToCents("12.34")).toBe(1234);
    expect(parseNonnegativeCurrencyToCents("1.234")).toBeNull();
    expect(parseNonnegativeCurrencyToCents("-1")).toBeNull();
  });

  it("parses percentages into integer basis points", () => {
    expect(parsePercentageToBasisPoints("0")).toBe(0);
    expect(parsePercentageToBasisPoints("33.33%")).toBe(3333);
    expect(parsePercentageToBasisPoints("33.333")).toBeNull();
    expect(parsePercentageToBasisPoints("-1")).toBeNull();
  });

  it("formats basis points for editing", () => {
    expect(formatBasisPointsForInput(3333)).toBe("33.33");
  });
});

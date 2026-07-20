import { describe, expect, it } from "vitest";
import { calculateEqualSplits } from "./calculateEqualSplits";

describe("calculateEqualSplits", () => {
  it("splits an evenly divisible amount", () => {
    const result = calculateEqualSplits(36000, [
      "gwen",
      "alex",
      "sarah",
    ]);

    expect(result).toEqual([
      {
        memberId: "gwen",
        shareCents: 12000,
      },
      {
        memberId: "alex",
        shareCents: 12000,
      },
      {
        memberId: "sarah",
        shareCents: 12000,
      },
    ]);
  });

  it("assigns remainder cents from the beginning", () => {
    const result = calculateEqualSplits(1000, [
      "gwen",
      "alex",
      "sarah",
    ]);

    expect(result).toEqual([
      {
        memberId: "gwen",
        shareCents: 334,
      },
      {
        memberId: "alex",
        shareCents: 333,
      },
      {
        memberId: "sarah",
        shareCents: 333,
      },
    ]);
  });

  it("distributes multiple remainder cents", () => {
    const result = calculateEqualSplits(1001, [
      "gwen",
      "alex",
      "sarah",
    ]);

    expect(result).toEqual([
      {
        memberId: "gwen",
        shareCents: 334,
      },
      {
        memberId: "alex",
        shareCents: 334,
      },
      {
        memberId: "sarah",
        shareCents: 333,
      },
    ]);
  });

  it("returns the full amount for one participant", () => {
    const result = calculateEqualSplits(7250, ["gwen"]);

    expect(result).toEqual([
      {
        memberId: "gwen",
        shareCents: 7250,
      },
    ]);
  });

  it("always allocates the original total", () => {
    const amountCents = 8450;

    const result = calculateEqualSplits(amountCents, [
      "gwen",
      "alex",
      "sarah",
    ]);

    const allocatedTotal = result.reduce(
      (total, split) => total + split.shareCents,
      0,
    );

    expect(allocatedTotal).toBe(amountCents);
  });

  it("rejects an amount of zero", () => {
    expect(() =>
      calculateEqualSplits(0, ["gwen"]),
    ).toThrow("Amount must be a positive integer.");
  });

  it("rejects negative amounts", () => {
    expect(() =>
      calculateEqualSplits(-500, ["gwen"]),
    ).toThrow("Amount must be a positive integer.");
  });

  it("rejects non-integer amounts", () => {
    expect(() =>
      calculateEqualSplits(12.5, ["gwen"]),
    ).toThrow("Amount must be a positive integer.");
  });

  it("rejects an empty participant list", () => {
    expect(() =>
      calculateEqualSplits(1000, []),
    ).toThrow("At least one participant is required.");
  });

  it("rejects duplicate participants", () => {
    expect(() =>
      calculateEqualSplits(1000, [
        "gwen",
        "alex",
        "gwen",
      ]),
    ).toThrow("Participant IDs must be unique.");
  });
});
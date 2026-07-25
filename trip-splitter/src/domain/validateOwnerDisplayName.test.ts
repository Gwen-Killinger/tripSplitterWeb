import { describe, expect, it } from "vitest";
import { validateOwnerDisplayName } from "./validateOwnerDisplayName";

describe("validateOwnerDisplayName", () => {
  it("trims surrounding whitespace", () => {
    expect(
      validateOwnerDisplayName("  Gwen Smith  "),
    ).toBe("Gwen Smith");
  });

  it("rejects an empty name", () => {
    expect(() => validateOwnerDisplayName("")).toThrow(
      "Enter your name.",
    );
  });

  it("rejects a whitespace-only name", () => {
    expect(() => validateOwnerDisplayName(" \t\n ")).toThrow(
      "Enter your name.",
    );
  });

  it("preserves casing without adding a role label", () => {
    const result = validateOwnerDisplayName("gWeN");

    expect(result).toBe("gWeN");
    expect(result).not.toContain("(Owner)");
    expect(result).not.toBe("You");
  });
});

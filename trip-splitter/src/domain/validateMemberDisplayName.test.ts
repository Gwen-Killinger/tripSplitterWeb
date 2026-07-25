import { describe, expect, it } from "vitest";
import type { TripMember } from "./models";
import { validateMemberDisplayName } from "./validateMemberDisplayName";

const members: TripMember[] = [
  {
    id: "owner",
    displayName: "You",
  },
  {
    id: "alex",
    displayName: "Alex Smith",
  },
];

describe("validateMemberDisplayName", () => {
  it("trims leading and trailing whitespace", () => {
    expect(
      validateMemberDisplayName("  Sarah Jones  ", members),
    ).toBe("Sarah Jones");
  });

  it("rejects a blank name", () => {
    expect(() =>
      validateMemberDisplayName("", members),
    ).toThrow("Enter a member name.");
  });

  it("rejects a whitespace-only name", () => {
    expect(() =>
      validateMemberDisplayName("   ", members),
    ).toThrow("Enter a member name.");
  });

  it("rejects an exact duplicate name", () => {
    expect(() =>
      validateMemberDisplayName("Alex Smith", members),
    ).toThrow("A member with this name already exists.");
  });

  it("rejects a duplicate name case-insensitively", () => {
    expect(() =>
      validateMemberDisplayName("  aLeX sMiTh  ", members),
    ).toThrow("A member with this name already exists.");
  });

  it("accepts a distinct name without mutating members", () => {
    const originalMembers = structuredClone(members);

    expect(
      validateMemberDisplayName("Gwen", members),
    ).toBe("Gwen");
    expect(members).toEqual(originalMembers);
  });
});

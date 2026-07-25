import { describe, expect, it } from "vitest";
import type { TripMember } from "./models";
import { resolveOwnerMemberId } from "./resolveOwnerMemberId";

const members: TripMember[] = [
  { id: "owner-member", displayName: "Gwen" },
  { id: "other-member", displayName: "Alex" },
];

describe("resolveOwnerMemberId", () => {
  it("uses a valid persisted owner member ID", () => {
    expect(
      resolveOwnerMemberId(
        "owner-member",
        "other-member",
        members,
      ),
    ).toBe("owner-member");
  });

  it("falls back to the UID-matched member when missing", () => {
    expect(
      resolveOwnerMemberId(undefined, "owner-member", members),
    ).toBe("owner-member");
  });

  it("falls back when the persisted member ID is invalid", () => {
    expect(
      resolveOwnerMemberId(
        "missing-member",
        "owner-member",
        members,
      ),
    ).toBe("owner-member");
  });

  it("rejects data without a reliable owner member", () => {
    expect(() =>
      resolveOwnerMemberId(
        undefined,
        "missing-owner",
        members,
      ),
    ).toThrow(
      "Trip data is invalid: the owner member could not be identified.",
    );
  });

  it("does not select an arbitrary member", () => {
    expect(() =>
      resolveOwnerMemberId(undefined, undefined, members),
    ).toThrow();
  });
});

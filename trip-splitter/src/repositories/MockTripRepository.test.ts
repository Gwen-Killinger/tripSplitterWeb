import { describe, expect, it } from "vitest";
import { MockTripRepository } from "./MockTripRepository";

describe("MockTripRepository.addMember", () => {
  it("adds and returns a member with a generated ID", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    const member = await repository.addMember("demo-trip", {
      displayName: "  Jordan Lee  ",
    });

    expect(member.id).toEqual(expect.any(String));
    expect(member.id).not.toBe("Jordan Lee");
    expect(member.displayName).toBe("Jordan Lee");

    const trip = await repository.getTrip("demo-trip");

    expect(trip?.members).toContainEqual(member);
    expect(trip?.members).toContainEqual({
      id: "member-gwen",
      displayName: "Gwen",
    });
    expect(trip?.members).toHaveLength(
      (tripBefore?.members.length ?? 0) + 1,
    );
  });

  it("rejects blank member names", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.addMember("demo-trip", {
        displayName: "   ",
      }),
    ).rejects.toThrow("Enter a member name.");
  });

  it("rejects duplicate names case-insensitively", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.addMember("demo-trip", {
        displayName: "  gWeN  ",
      }),
    ).rejects.toThrow(
      "A member with this name already exists.",
    );
  });

  it("rejects an unknown trip", async () => {
    const repository = new MockTripRepository();

    await expect(
      repository.addMember("missing-trip", {
        displayName: "Jordan",
      }),
    ).rejects.toThrow("Trip not found: missing-trip");
  });

  it("does not change existing expenses", async () => {
    const repository = new MockTripRepository();
    const tripBefore = await repository.getTrip("demo-trip");

    await repository.addMember("demo-trip", {
      displayName: "Jordan",
    });

    const tripAfter = await repository.getTrip("demo-trip");

    expect(tripAfter?.expenses).toEqual(tripBefore?.expenses);
  });
});
